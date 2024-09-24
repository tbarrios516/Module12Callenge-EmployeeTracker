const inquirer = require('inquirer');
const { Client } = require('pg');
const consoleTable = require('console.table');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'employee_db',
  password: 'codingkid',
  port: 5432,
});

client.connect();

const mainMenu = async () => {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      'View All Departments',
      'View All Roles',
      'View All Employees',
      'Add Department',
      'Add Role',
      'Add Employee',
      'Update Employee Role',
      'Exit',
    ],
  });

  switch (action) {
    case 'View All Departments':
      viewDepartments();
      break;
    case 'View All Roles':
      viewRoles();
      break;
    case 'View All Employees':
      viewEmployees();
      break;
    case 'Add Department':
      addDepartment();
      break;
    case 'Add Role':
      addRole();
      break;
    case 'Add Employee':
      addEmployee();
      break;
    case 'Update Employee Role':
      updateEmployeeRole();
      break;
    case 'Exit':
      client.end();
      console.log('Goodbye!');
      break;
  }
};

const viewDepartments = async () => {
  const result = await client.query('SELECT * FROM department');
  console.table(result.rows);
  mainMenu();
};

const viewRoles = async () => {
  const result = await client.query(
    `SELECT role.id, role.title, role.salary, department.name AS department
     FROM role 
     JOIN department ON role.department_id = department.id`
  );
  console.table(result.rows);
  mainMenu();
};

const viewEmployees = async () => {
  const result = await client.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, manager.first_name AS manager
     FROM employee 
     JOIN role ON employee.role_id = role.id 
     JOIN department ON role.department_id = department.id
     LEFT JOIN employee manager ON employee.manager_id = manager.id`
  );
  console.table(result.rows);
  mainMenu();
};

const addDepartment = async () => {
  const { departmentName } = await inquirer.prompt({
    type: 'input',
    name: 'departmentName',
    message: 'Enter the name of the new department:',
  });

  await client.query('INSERT INTO department (name) VALUES ($1)', [departmentName]);
  console.log(`${departmentName} added successfully.`);
  mainMenu();
};

const addRole = async () => {
  const departments = await client.query('SELECT * FROM department');
  const { title, salary, departmentId } = await inquirer.prompt([
    { type: 'input', name: 'title', message: 'Enter the role title:' },
    { type: 'input', name: 'salary', message: 'Enter the salary for this role:' },
    {
      type: 'list',
      name: 'departmentId',
      message: 'Select the department:',
      choices: departments.rows.map((dept) => ({ name: dept.name, value: dept.id })),
    },
  ]);

  await client.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, departmentId]);
  console.log(`${title} role added successfully.`);
  mainMenu();
};

const addEmployee = async () => {
  const roles = await client.query('SELECT * FROM role');
  const employees = await client.query('SELECT * FROM employee');

  const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
    { type: 'input', name: 'firstName', message: 'Enter the employee first name:' },
    { type: 'input', name: 'lastName', message: 'Enter the employee last name:' },
    {
      type: 'list',
      name: 'roleId',
      message: 'Select the role:',
      choices: roles.rows.map((role) => ({ name: role.title, value: role.id })),
    },
    {
      type: 'list',
      name: 'managerId',
      message: 'Select the manager:',
      choices: employees.rows.map((emp) => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id })).concat([{ name: 'None', value: null }]),
    },
  ]);

  await client.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [firstName, lastName, roleId, managerId]);
  console.log(`${firstName} ${lastName} added as an employee.`);
  mainMenu();
};

const updateEmployeeRole = async () => {
  const employees = await client.query('SELECT * FROM employee');
  const roles = await client.query('SELECT * FROM role');

  const { employeeId, newRoleId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'employeeId',
      message: 'Select the employee to update:',
      choices: employees.rows.map((emp) => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id })),
    },
    {
      type: 'list',
      name: 'newRoleId',
      message: 'Select the new role:',
      choices: roles.rows.map((role) => ({ name: role.title, value: role.id })),
    },
  ]);

  await client.query('UPDATE employee SET role_id = $1 WHERE id = $2', [newRoleId, employeeId]);
  console.log('Employee role updated successfully.');
  mainMenu();
};

mainMenu();
