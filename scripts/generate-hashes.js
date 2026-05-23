const bcrypt = require('bcryptjs');

const passwords = [
  { name: 'Mrs. Lakshmi Devi', email: 'lakshmi@kalnet.edu', plain: 'lakshmi123' },
  { name: 'Mr. Suresh Babu',   email: 'suresh@kalnet.edu',  plain: 'suresh123'  },
  { name: 'Mrs. Anita Sharma', email: 'anita@kalnet.edu',   plain: 'anita123'   },
  { name: 'Mr. Ravi Teja',     email: 'ravi@kalnet.edu',    plain: 'ravi123'    },
  { name: 'Mrs. Preethi Nair', email: 'preethi@kalnet.edu', plain: 'preethi123' },
  { name: 'Mr. Karthik Reddy', email: 'karthik@kalnet.edu', plain: 'karthik123' },
  { name: 'Mrs. Sunita Rao',   email: 'sunita@kalnet.edu',  plain: 'sunita123'  },
  { name: 'Dr. Venkat Prasad', email: 'hod@kalnet.edu',     plain: 'hod@kalnet' },
];

async function main() {
  console.log('-- Staff INSERT with bcrypt hashed passwords');
  console.log('INSERT INTO staff (name, email, password, role, assignedClass, isActive) VALUES');

  const rows = [];
  const classes = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12', null];
  const roles   = ['CLASS_TEACHER','CLASS_TEACHER','CLASS_TEACHER','CLASS_TEACHER','CLASS_TEACHER','CLASS_TEACHER','CLASS_TEACHER','HOD'];

  for (let i = 0; i < passwords.length; i++) {
    const hash = await bcrypt.hash(passwords[i].plain, 10);
    const cls  = classes[i] ? `'${classes[i]}'` : 'NULL';
    rows.push(`('${passwords[i].name}', '${passwords[i].email}', '${hash}', '${roles[i]}', ${cls}, 1)`);
  }

  console.log(rows.join(',\n') + ';');
}

main();
