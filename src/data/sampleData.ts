import { Grade, Student, Payment } from '../types';

export const initialGrades: Grade[] = [
  {
    id: "grade-1",
    name: "Grade 1",
    description: "Lower Primary education focusing on literacy, numeracy, science, and creative arts.",
    ageRange: "6 - 7 years",
    feeGroups: [
      {
        id: "fg-1",
        name: "SCHOOL FEE",
        items: [
          { id: "item-1-1", label: "Tuition & Learning Materials", amount: 1175000 }
        ]
      },
      {
        id: "fg-2",
        name: "TRANSPORT FEE",
        items: [
          { id: "item-1-2", label: "School Bus Service (Annual)", amount: 600000 }
        ]
      },
      {
        id: "fg-3",
        name: "ADMISSION FEE",
        items: [
          { id: "item-1-3", label: "Registration & Student Kit", amount: 150000 }
        ]
      }
    ]
  },
  {
    id: "grade-2",
    name: "Grade 2",
    description: "Primary foundation building with expanded English, Kiswahili, and ICT basics.",
    ageRange: "7 - 8 years",
    feeGroups: [
      {
        id: "fg-2-1",
        name: "SCHOOL FEE",
        items: [
          { id: "item-2-1", label: "Tuition & Digital Learning Lab", amount: 1250000 }
        ]
      },
      {
        id: "fg-2-2",
        name: "TRANSPORT FEE",
        items: [
          { id: "item-2-2", label: "School Bus Service (Annual)", amount: 600000 }
        ]
      },
      {
        id: "fg-2-3",
        name: "ADMISSION FEE",
        items: [
          { id: "item-2-3", label: "Registration & Medical Care", amount: 150000 }
        ]
      }
    ]
  },
  {
    id: "grade-3",
    name: "Grade 3",
    description: "Upper Primary preparatory stream with STEM robotics, environmental science, and sports.",
    ageRange: "8 - 9 years",
    feeGroups: [
      {
        id: "fg-3-1",
        name: "SCHOOL FEE",
        items: [
          { id: "item-3-1", label: "Tuition & Standard Academic Package", amount: 1350000 },
          { id: "item-3-2", label: "Science & Robotics Lab Practical", amount: 50000 }
        ]
      },
      {
        id: "fg-3-2",
        name: "TRANSPORT FEE",
        items: [
          { id: "item-3-3", label: "School Bus Service (Annual)", amount: 650000 }
        ]
      },
      {
        id: "fg-3-3",
        name: "ADMISSION FEE",
        items: [
          { id: "item-3-4", label: "Registration & Uniform Set", amount: 150000 }
        ]
      }
    ]
  }
];

export const initialStudents: Student[] = [
  {
    id: "stu-1",
    applicationNo: "BFS-2026-1001",
    firstName: "Amina",
    middleName: "Hassan",
    lastName: "Juma",
    gender: "Female",
    dob: "2019-03-14",
    address: "Mwanakwerekwe, Zanzibar",
    parentName: "Bi Mwanaisha Ali",
    parentPhone: "0777123456",
    parentAddress: "Mwanakwerekwe Plot 42, Zanzibar",
    parentRelationship: "Mother",
    parentNationalId: "1975123456789",
    emergencyContactName: "Hassan Ali",
    emergencyContactPhone: "0777111222",
    emergencyContactRelationship: "Father",
    gradeId: "grade-1",
    academicYear: "2026/2027",
    previousSchool: "Al-Hikma Nursery",
    notes: "Passionate about drawing and reading Kiswahili stories.",
    status: "Admitted",
    createdAt: "2026-01-10T09:30:00Z"
  },
  {
    id: "stu-2",
    applicationNo: "BFS-2026-1002",
    firstName: "Salim",
    middleName: "Khamis",
    lastName: "Ali",
    gender: "Male",
    dob: "2018-07-22",
    address: "Chukwani, Zanzibar",
    parentName: "Mzee Haji Omar",
    parentPhone: "0682987654",
    parentAddress: "Chukwani Beach Road, Unguja",
    parentRelationship: "Father",
    parentNationalId: "1968051234567",
    emergencyContactName: "Bi Fatuma Omar",
    emergencyContactPhone: "0777333444",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-2",
    academicYear: "2026/2027",
    previousSchool: "Kiembesamaki Primary",
    notes: "Requires front-row seating for slight vision focus.",
    status: "Admitted",
    createdAt: "2026-01-12T11:15:00Z"
  },
  {
    id: "stu-3",
    applicationNo: "BFS-2026-1003",
    firstName: "Zuhura",
    middleName: "Omar",
    lastName: "Haji",
    gender: "Female",
    dob: "2017-11-05",
    address: "Stone Town (Unguja), Zanzibar",
    parentName: "Omar Haji Mwadini",
    parentPhone: "0778407818",
    parentAddress: "Hurumzi Street, Stone Town",
    parentRelationship: "Father",
    parentNationalId: "1972034567890",
    emergencyContactName: "Bi Mariam Mwadini",
    emergencyContactPhone: "0778555666",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-3",
    academicYear: "2026/2027",
    previousSchool: "St. Monica English Medium",
    notes: "Skilled in mathematics and school debate.",
    status: "Paid",
    createdAt: "2026-01-15T14:20:00Z"
  },
  {
    id: "stu-4",
    applicationNo: "BFS-2026-1004",
    firstName: "Faraji",
    middleName: "Mussa",
    lastName: "Said",
    gender: "Male",
    dob: "2019-05-18",
    address: "Mwanakwerekwe, Zanzibar",
    parentName: "Mussa Said Khatib",
    parentPhone: "0773554433",
    parentAddress: "Mwanakwerekwe Darajani",
    parentRelationship: "Father",
    parentNationalId: "1980012345678",
    emergencyContactName: "Bi Aisha Khatib",
    emergencyContactPhone: "0773777888",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-1",
    academicYear: "2026/2027",
    previousSchool: "Kiembesamaki Nursery",
    notes: "Applicant passed preliminary entrance interview.",
    status: "Paid",
    createdAt: "2026-01-18T10:00:00Z"
  },
  {
    id: "stu-5",
    applicationNo: "BFS-2026-1005",
    firstName: "Neema",
    middleName: "Joseph",
    lastName: "Mrema",
    gender: "Female",
    dob: "2018-09-10",
    address: "Mbweni, Zanzibar",
    parentName: "Joseph Mrema",
    parentPhone: "0754889900",
    parentAddress: "Mbweni Ruins Area",
    parentRelationship: "Father",
    parentNationalId: "ZAN456789012",
    emergencyContactName: "Bi Grace Mrema",
    emergencyContactPhone: "0754999000",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-2",
    academicYear: "2026/2027",
    previousSchool: "Zanzibar Feza International",
    notes: "High academic assessment score.",
    status: "Admitted",
    createdAt: "2026-01-20T16:45:00Z"
  },
  {
    id: "stu-6",
    applicationNo: "BFS-2026-1006",
    firstName: "Rashid",
    middleName: "Nassor",
    lastName: "Juma",
    gender: "Male",
    dob: "2017-04-03",
    address: "Mazizini, Zanzibar",
    parentName: "Nassor Juma Vuai",
    parentPhone: "0776223344",
    parentAddress: "Mazizini Near Airport",
    parentRelationship: "Father",
    parentNationalId: "1970098765432",
    emergencyContactName: "Bi Zainab Vuai",
    emergencyContactPhone: "0776111222",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-3",
    academicYear: "2026/2027",
    previousSchool: "Sos Kindergarten Zanzibar",
    notes: "Interested in football and computer coding.",
    status: "Pending",
    createdAt: "2026-01-22T08:30:00Z"
  },
  {
    id: "stu-7",
    applicationNo: "BFS-2026-1007",
    firstName: "Fatma",
    middleName: "Kassim",
    lastName: "Bakari",
    gender: "Female",
    dob: "2019-01-30",
    address: "Stone Town (Unguja), Zanzibar",
    parentName: "Bi Mariam Bakari",
    parentPhone: "0779112233",
    parentAddress: "Shangani Street, Stone Town",
    parentRelationship: "Mother",
    parentNationalId: "ZAN789012345",
    emergencyContactName: "Kassim Bakari",
    emergencyContactPhone: "0779333444",
    emergencyContactRelationship: "Father",
    gradeId: "grade-1",
    academicYear: "2026/2027",
    previousSchool: "Al-Hikma Nursery",
    notes: "Interview scheduled for next Monday.",
    status: "Pending",
    createdAt: "2026-01-25T13:10:00Z"
  },
  {
    id: "stu-8",
    applicationNo: "BFS-2026-1008",
    firstName: "Baraka",
    middleName: "Hamad",
    lastName: "Vuai",
    gender: "Male",
    dob: "2018-08-12",
    address: "Chukwani, Zanzibar",
    parentName: "Hamad Vuai Machano",
    parentPhone: "0774667788",
    parentAddress: "Chukwani Kiembe Samaki",
    parentRelationship: "Father",
    parentNationalId: "1978112233445",
    emergencyContactName: "Bi Khadija Machano",
    emergencyContactPhone: "0774555666",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-2",
    academicYear: "2026/2027",
    previousSchool: "Kiembesamaki Primary",
    notes: "Submitted all birth certificate copies.",
    status: "Paid",
    createdAt: "2026-01-28T09:40:00Z"
  },
  {
    id: "stu-9",
    applicationNo: "BFS-2026-1009",
    firstName: "Khadija",
    middleName: "Said",
    lastName: "Khamis",
    gender: "Female",
    dob: "2017-06-25",
    address: "Mwanakwerekwe, Zanzibar",
    parentName: "Said Khamis Mzee",
    parentPhone: "0772334455",
    parentAddress: "Mwanakwerekwe Njia Panda",
    parentRelationship: "Father",
    parentNationalId: "1965123456789",
    emergencyContactName: "Bi Amina Mzee",
    emergencyContactPhone: "0772111222",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-3",
    academicYear: "2026/2027",
    previousSchool: "Mwembeladu Primary",
    notes: "Special interest in science club.",
    status: "Admitted",
    createdAt: "2026-02-01T15:00:00Z"
  },
  {
    id: "stu-10",
    applicationNo: "BFS-2026-1010",
    firstName: "Yussuf",
    middleName: "Abdalla",
    lastName: "Machano",
    gender: "Male",
    dob: "2019-10-14",
    address: "Chukwani, Zanzibar",
    parentName: "Bi Asha Machano",
    parentPhone: "0778998877",
    parentAddress: "Chukwani Police Line",
    parentRelationship: "Mother",
    parentNationalId: "ZAN234567890",
    emergencyContactName: "Abdalla Machano",
    emergencyContactPhone: "0778888999",
    emergencyContactRelationship: "Father",
    gradeId: "grade-1",
    academicYear: "2026/2027",
    previousSchool: "Little Angels Nursery",
    notes: "Awaiting parent interview confirmation.",
    status: "Pending",
    createdAt: "2026-02-05T11:20:00Z"
  },
  {
    id: "stu-11",
    applicationNo: "BFS-2026-1011",
    firstName: "Mariam",
    middleName: "Suleiman",
    lastName: "Saleh",
    gender: "Female",
    dob: "2018-02-19",
    address: "Stone Town (Unguja), Zanzibar",
    parentName: "Suleiman Saleh",
    parentPhone: "0771556677",
    parentAddress: "Vuga Road, Stone Town",
    parentRelationship: "Father",
    parentNationalId: "1973045678901",
    emergencyContactName: "Bi Halima Saleh",
    emergencyContactPhone: "0771777888",
    emergencyContactRelationship: "Mother",
    gradeId: "grade-2",
    academicYear: "2026/2027",
    previousSchool: "Al-Hikma Nursery",
    notes: "Full payment made via bank.",
    status: "Admitted",
    createdAt: "2026-02-08T14:15:00Z"
  },
  {
    id: "stu-12",
    applicationNo: "BFS-2026-1012",
    firstName: "Daudi",
    middleName: "Ally",
    lastName: "Mohamed",
    gender: "Male",
    dob: "2017-12-01",
    address: "Mbweni, Zanzibar",
    parentName: "Bi Fatma Mohamed",
    parentPhone: "0685443322",
    parentAddress: "Mbweni Sungura Lane",
    parentRelationship: "Mother",
    parentNationalId: "1976078901234",
    emergencyContactName: "Ally Mohamed",
    emergencyContactPhone: "0685333444",
    emergencyContactRelationship: "Father",
    gradeId: "grade-3",
    academicYear: "2026/2027",
    previousSchool: "Zanzibar Feza International",
    notes: "Transfer student from Dar es Salaam branch.",
    status: "Admitted",
    createdAt: "2026-02-10T10:05:00Z"
  }
];

export const initialPayments: Payment[] = [
  // Student 1 (Amina Hassan Juma - Grade 1: 1,925,000 Tsh total)
  {
    id: "pay-1",
    studentId: "stu-1",
    amount: 150000,
    method: "M-Pesa",
    date: "2026-01-10",
    reference: "MP260110091",
    notes: "Admission & Registration Fee"
  },
  {
    id: "pay-2",
    studentId: "stu-1",
    amount: 1175000,
    method: "Mixx by Yas",
    date: "2026-01-11",
    reference: "MX260111452",
    notes: "Annual School Tuition Fee"
  },
  {
    id: "pay-3",
    studentId: "stu-1",
    amount: 600000,
    method: "Bank",
    date: "2026-01-12",
    reference: "CRDB-994821",
    notes: "Annual Bus Transport Fee"
  },

  // Student 2 (Salim Khamis Ali - Grade 2: 2,000,000 Tsh total)
  {
    id: "pay-4",
    studentId: "stu-2",
    amount: 150000,
    method: "Mixx by Yas",
    date: "2026-01-12",
    reference: "MX260112831",
    notes: "Admission Fee"
  },
  {
    id: "pay-5",
    studentId: "stu-2",
    amount: 1250000,
    method: "Bank",
    date: "2026-01-14",
    reference: "NMB-778219",
    notes: "Tuition Term 1 & 2"
  },
  {
    id: "pay-6",
    studentId: "stu-2",
    amount: 600000,
    method: "M-Pesa",
    date: "2026-01-15",
    reference: "MP260115024",
    notes: "Transport Fee Full"
  },

  // Student 3 (Zuhura Omar Haji - Grade 3: 2,200,000 Tsh total)
  {
    id: "pay-7",
    studentId: "stu-3",
    amount: 150000,
    method: "M-Pesa",
    date: "2026-01-15",
    reference: "MP260115993",
    notes: "Admission Fee"
  },
  {
    id: "pay-8",
    studentId: "stu-3",
    amount: 1400000,
    method: "Airtel Money",
    date: "2026-01-16",
    reference: "AM260116812",
    notes: "Tuition and Robotics Fee"
  },

  // Student 4 (Faraji Mussa Said - Grade 1: 1,925,000 Tsh total)
  {
    id: "pay-9",
    studentId: "stu-4",
    amount: 150000,
    method: "Mixx by Yas",
    date: "2026-01-18",
    reference: "MX260118331",
    notes: "Admission Fee"
  },
  {
    id: "pay-10",
    studentId: "stu-4",
    amount: 1175000,
    method: "Bank",
    date: "2026-01-19",
    reference: "PBZ-551029",
    notes: "Tuition Paid via People's Bank of Zanzibar"
  },

  // Student 5 (Neema Joseph Mrema - Grade 2: 2,000,000 Tsh total)
  {
    id: "pay-11",
    studentId: "stu-5",
    amount: 150000,
    method: "Bank",
    date: "2026-01-20",
    reference: "CRDB-104928",
    notes: "Admission Fee"
  },
  {
    id: "pay-12",
    studentId: "stu-5",
    amount: 1850000,
    method: "Bank",
    date: "2026-01-21",
    reference: "CRDB-104992",
    notes: "Tuition + Transport Full Settlement"
  },

  // Student 8 (Baraka Hamad Vuai - Grade 2: 2,000,000 Tsh total)
  {
    id: "pay-13",
    studentId: "stu-8",
    amount: 150000,
    method: "M-Pesa",
    date: "2026-01-28",
    reference: "MP260128919",
    notes: "Admission Fee"
  },
  {
    id: "pay-14",
    studentId: "stu-8",
    amount: 800000,
    method: "Mixx by Yas",
    date: "2026-01-29",
    reference: "MX260129772",
    notes: "Tuition First Installment"
  },

  // Student 9 (Khadija Said Khamis - Grade 3: 2,200,000 Tsh total)
  {
    id: "pay-15",
    studentId: "stu-9",
    amount: 150000,
    method: "Airtel Money",
    date: "2026-02-01",
    reference: "AM260201283",
    notes: "Admission Fee"
  },
  {
    id: "pay-16",
    studentId: "stu-9",
    amount: 1400000,
    method: "M-Pesa",
    date: "2026-02-02",
    reference: "MP260202991",
    notes: "Tuition & Lab Fee"
  },
  {
    id: "pay-17",
    studentId: "stu-9",
    amount: 650000,
    method: "Bank",
    date: "2026-02-03",
    reference: "NMB-993821",
    notes: "Transport Fee Full"
  },

  // Student 11 (Mariam Suleiman Saleh - Grade 2: 2,000,000 Tsh total)
  {
    id: "pay-18",
    studentId: "stu-11",
    amount: 2000000,
    method: "Bank",
    date: "2026-02-08",
    reference: "CRDB-556102",
    notes: "Single Lump Sum Payment for Full Academic Year"
  },

  // Student 12 (Daudi Ally Mohamed - Grade 3: 2,200,000 Tsh total)
  {
    id: "pay-19",
    studentId: "stu-12",
    amount: 150000,
    method: "Mixx by Yas",
    date: "2026-02-10",
    reference: "MX260210419",
    notes: "Admission Fee"
  },
  {
    id: "pay-20",
    studentId: "stu-12",
    amount: 2050000,
    method: "Bank",
    date: "2026-02-11",
    reference: "PBZ-889912",
    notes: "Full Tuition + Transport + Lab Package"
  }
];
