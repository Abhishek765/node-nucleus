#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { Command } from "commander";
import { simpleGit } from "simple-git";
import shell from "shelljs";
import chalk from "chalk";
import inquirer from "inquirer";

const program = new Command();

// Helper function to clone the GitHub template
const cloneTemplate = async (repoUrl, destination, projectName) => {
  try {
    console.log(chalk.blue("Cloning template..."));
    await simpleGit().clone(repoUrl, destination);
    console.log(chalk.green("Template cloned successfully!"));
    const projectPath = path.join(process.cwd(), projectName);

    const envSamplePath = path.join(projectPath, ".env.sample");
    const envDevelopmentPath = path.join(projectPath, ".env.development");
    const envProductionPath = path.join(projectPath, ".env.production");

    if (fs.existsSync(envSamplePath)) {
      fs.copyFileSync(envSamplePath, envDevelopmentPath);
      fs.copyFileSync(envSamplePath, envProductionPath);
      console.log(
        chalk.green(
          ".env.development and .env.production created from .env.sample"
        )
      );
    } else {
      console.log(
        chalk.red(".env.sample file not found in the cloned template!")
      );
    }

    console.log(chalk.blueBright(`\ncd ${projectName}`));
    console.log(chalk.blueBright(`yarn`));
    console.log(chalk.blueBright(`yarn dev\n`));
  } catch (error) {
    console.log(chalk.red("Error cloning template:", error));
  }
};

// Helper function to set up the project from scratch
const setupFromScratch = (projectName) => {
  console.log(chalk.yellow("Setting up project from scratch..."));
  shell.mkdir(projectName);
  shell.cd(projectName);
  shell.exec("npm init -y");
  shell.exec(
    "npm install express typescript ts-node @types/express @types/node && npm i --save-dev nodemon"
  );
  shell.exec("npx tsc --init");

  const gitIgnoreContent = `node_modules
dist`;

  fs.writeFileSync(".gitignore", gitIgnoreContent.trim());
  console.log(chalk.green("\n.gitignore created and node_modules excluded!\n"));

  //  Creating src folder and index.ts file
  shell.mkdir("src");
  const indexTsContent = `
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server is running on http://localhost:\${port}\`);
});
  `;
  fs.writeFileSync("src/index.ts", indexTsContent.trim());

  // "dev" command to package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  packageJson.scripts = {
    ...packageJson.scripts,
    dev: "nodemon --exec ts-node src/index.ts",
  };
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
  console.log(chalk.green("Node-Express-TypeScript project set up done!"));
  console.log(chalk.blueBright(`\ncd ${projectName}`));
  console.log(chalk.blueBright(`npm i`));
  console.log(chalk.blueBright(`npm run dev\n`));
};

// Command for setting up the project
program
  .command("setup <project-name>")
  .description("Set up a new Node-Express-TypeScript project")
  .action((projectName) => {
    inquirer
      .prompt([
        {
          type: "list",
          name: "setupChoice",
          message: "How would you like to set up your project?",
          choices: [
            "Clone the Node Backend Template from GitHub",
            "Set up a new Node-Express-TypeScript project from scratch",
          ],
        },
      ])
      .then((answers) => {
        if (
          answers.setupChoice === "Clone the Node Backend Template from GitHub"
        ) {
          const repoUrl =
            "https://github.com/Abhishek765/ultimate-node-backend-setup.git";
          const destination = `${process.cwd()}/${projectName}`;
          cloneTemplate(repoUrl, destination, projectName);
        } else {
          setupFromScratch(projectName);
        }
      })
      .catch((error) => {
        console.error(chalk.red("Error during setup:", error));
      });
  });

program.parse(process.argv);
