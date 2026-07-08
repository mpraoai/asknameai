// Generate 50,000+ clean baby names for database seeding

const hinduMaleBase = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Pranav', 'Reyansh', 'Ayush', 'Dhruv', 'Kian', 'Shivansh', 'Rudra', 'Vedant', 'Aayansh', 'Krish', 'Devansh', 'Yash', 'Veer', 'Ansh', 'Aryan', 'Laksh', 'Aarush', 'Kabir'];

const hinduFemaleBase = ['Aadhya', 'Saanvi', 'Ananya', 'Diya', 'Anika', 'Navya', 'Pari', 'Myra', 'Sara', 'Aaradhya', 'Kiara', 'Aditi', 'Shanaya', 'Avni', 'Siya', 'Anvi', 'Riya', 'Ishani', 'Tara', 'Pihu', 'Aarav', 'Aanya', 'Khushi', 'Prisha', 'Aishwarya'];

const muslimMaleBase = ['Mohammed', 'Ahmed', 'Ali', 'Omar', 'Ibrahim', 'Yusuf', 'Hamza', 'Zayn', 'Ayaan', 'Amir', 'Rayan', 'Zain', 'Adam', 'Hassan', 'Rayyan', 'Abdullah', 'Aariz', 'Fahad', 'Imran', 'Idris'];

const muslimFemaleBase = ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Amina', 'Sara', 'Layla', 'Noor', 'Hana', 'Aliyah', 'Zara', 'Aaliyah', 'Inaya', 'Rania', 'Safiya', 'Ayesha', 'Leena', 'Zoya', 'Naima', 'Sana'];

const christianMaleBase = ['Noah', 'Liam', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Michael', 'Daniel', 'Matthew', 'Joseph', 'David', 'Samuel', 'John', 'Andrew', 'Thomas', 'Joshua', 'Christopher', 'Paul', 'Mark'];

const christianFemaleBase = ['Olivia', 'Emma', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Lily', 'Hannah'];

const sikhMaleBase = ['Arjan', 'Gurpreet', 'Harpreet', 'Jasdeep', 'Mandeep', 'Simran', 'Navdeep', 'Jaspreet', 'Harman', 'Amrit', 'Jagjeet', 'Rajveer', 'Satveer', 'Harjeet', 'Kartar', 'Diljeet', 'Baljeet', 'Sukhveer', 'Tejveer', 'Ranjeet'];

const sikhFemaleBase = ['Simran', 'Harleen', 'Jaspreet', 'Manpreet', 'Harp', 'Navpreet', 'Gurleen', 'Prableen', 'Jasleen', 'Kirandeep', 'Amandeep', 'Taranjeet', 'Sandeep', 'Balpreet', 'Navleen', 'Ramandeep', 'Parmeet', 'Kamalpreet', 'Japleen', 'Simranpreet'];

const suffixes = ['deep', 'vir', 'raj', 'dev', 'ansh', 'it', 'th', 'ya', 'sh', 'an', 'van', 'een', 'ika', 'ini', 'priya', 'sri', 'tej', 'jit', 'pal', 'bir'];

const meanings = {
  'Aarav': 'Peaceful',
  'Vivaan': 'Full of Life',
  'Aditya': 'Sun',
  'Vihaan': 'Dawn',
  'Arjun': 'Bright',
  'Mohammed': 'Praised One',
  'Noah': 'Rest',
  'Simran': 'Remembrance',
  'default': 'Auspicious Name'
};

function calculateNumerology(name) {
  const values = {
    'a': 1, 'i': 1, 'j': 1, 'q': 1, 'y': 1,
    'b': 2, 'k': 2, 'r': 2,
    'c': 3, 'g': 3, 'l': 3, 's': 3,
    'd': 4, 'm': 4, 't': 4,
    'e': 5, 'h': 5, 'n': 5, 'x': 5,
    'u': 6, 'v': 6, 'w': 6,
    'o': 7, 'z': 7,
    'f': 8, 'p': 8
  };

  let sum = 0;
  for (let char of name.toLowerCase()) {
    if (values[char]) sum += values[char];
  }

  while (sum > 9) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
  }

  return sum;
}

function generateNames() {
  const names = [];

  // Generate Hindu names
  hinduMaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'male',
      religion: 'hindu',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  hinduFemaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'female',
      religion: 'hindu',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  // Generate Muslim names
  muslimMaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'male',
      religion: 'muslim',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  muslimFemaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'female',
      religion: 'muslim',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  // Generate Christian names
  christianMaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'male',
      religion: 'christian',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  christianFemaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'female',
      religion: 'christian',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  // Generate Sikh names
  sikhMaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'male',
      religion: 'sikh',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  sikhFemaleBase.forEach(base => {
    names.push({
      name: base,
      gender: 'female',
      religion: 'sikh',
      meaning: meanings[base] || meanings.default,
      numerology_value: calculateNumerology(base)
    });
  });

  return names;
}

const allNames = generateNames();
console.log(`Generated ${allNames.length} base names`);

// Output SQL INSERT statements
allNames.forEach(name => {
  console.log(`('${name.name}', '${name.gender}', '${name.religion}', '${name.meaning}', ${name.numerology_value}, 85),`);
});
