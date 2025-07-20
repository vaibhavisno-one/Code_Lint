#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require("inquirer").default;

const execa = require('execa');

const ESLINT_CONFIG_PATH = path.resolve(process.cwd(), '.eslintrc.json');
const PRETTIER_CONFIG_PATH = path.resolve(process.cwd(), '.prettierrc.json');

async function askFormattingQuestions() {
  const eslintQuestions = [
    {
      type: 'list',
      name: 'quotes',
      message: 'Which quotes do you prefer?',
      choices: ['single', 'double'],
      default: 'single',
    },
    {
      type: 'confirm',
      name: 'semi',
      message: 'Use semicolons?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'noUnusedVars',
      message: 'Warn on unused variables?',
      default: true,
    },
  ];

  const prettierQuestions = [
    {
      type: 'list',
      name: 'singleQuote',
      message: 'Prettier: Use single quotes?',
        choices: [
    { name: 'Yes (single quotes)', value: true },
    { name: 'No (double quotes)', value: false },
  ],
      default: true,
    },
    {
      type: 'number',
      name: 'tabWidth',
      message: 'Prettier: Tab width?',
      default: 2,
      validate: (val) => val > 0 || 'Must be a positive number',
    },
    {
      type: 'list',
      name: 'trailingComma',
      message: 'Prettier: Trailing commas?',
      choices: ['none', 'es5', 'all'],
      default: 'none',
    },
  ];

  const eslintAnswers = await inquirer.prompt(eslintQuestions);
  const prettierAnswers = await inquirer.prompt(prettierQuestions);

  return { eslintAnswers, prettierAnswers };
}

function generateESLintConfig({ quotes, semi, noUnusedVars }) {
  return {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      quotes: ['error', quotes],
      semi: ['error', semi ? 'always' : 'never'],
      'no-unused-vars': noUnusedVars ? 'warn' : 'off',
    },
  };
}

function generatePrettierConfig({ singleQuote, tabWidth, trailingComma }) {
  return {
    singleQuote,
    tabWidth,
    trailingComma,
    semi: true,
  };
}

async function writeConfigFiles(eslintConfig, prettierConfig) {
  fs.writeFileSync(ESLINT_CONFIG_PATH, JSON.stringify(eslintConfig, null, 2));
  fs.writeFileSync(PRETTIER_CONFIG_PATH, JSON.stringify(prettierConfig, null, 2));
  console.log('✅ Created .eslintrc.json and .prettierrc.json');
}

async function runFormatters() {
  console.log('\n🔧 Formatting with ESLint...');
  try {
    await execa('npx', ['eslint', '.', '--fix'], { stdio: 'inherit' });
  } catch {
    console.log('⚠️ ESLint finished with warnings or errors.');
  }

  console.log('\n🎨 Formatting with Prettier...');
  try {
    await execa('npx', ['prettier', '--write', '.'], { stdio: 'inherit' });
  } catch {
    console.log('⚠️ Prettier finished with warnings or errors.');
  }

  console.log('\n✅ Formatting complete!');
}

async function main() {
  const eslintExists = fs.existsSync(ESLINT_CONFIG_PATH);
  const prettierExists = fs.existsSync(PRETTIER_CONFIG_PATH);

  if (!eslintExists || !prettierExists) {
    console.log('🔧 No config found. Starting first-time setup...\n');
    const { eslintAnswers, prettierAnswers } = await askFormattingQuestions();
    const eslintConfig = generateESLintConfig(eslintAnswers);
    const prettierConfig = generatePrettierConfig(prettierAnswers);
    await writeConfigFiles(eslintConfig, prettierConfig);
  } else {
    console.log('📄 Config files found. Skipping setup.');
  }

  await runFormatters();
}

main();
