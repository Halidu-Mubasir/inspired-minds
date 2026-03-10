export interface Teacher {
  id: string;
  name: string;
  qualification: "HND" | "Bachelor's Degree" | "Master's Degree" | "PhD";
  subjects: string[];
  experience_years: number;
  bio: string;
}

export const TEACHERS: Teacher[] = [
  {
    id: "1",
    name: "Kwame Asante",
    qualification: "Master's Degree",
    subjects: ["Mathematics", "Further Mathematics", "Elective Mathematics"],
    experience_years: 7,
    bio: "Kwame holds a Master's in Applied Mathematics from the University of Ghana. He specialises in making abstract mathematical concepts concrete and accessible, with a strong track record in preparing students for WASSCE and university-level calculus.",
  },
  {
    id: "2",
    name: "Abena Kyei",
    qualification: "Bachelor's Degree",
    subjects: ["English Language", "Literature", "Social Studies"],
    experience_years: 4,
    bio: "A passionate English teacher with a degree in English Studies, Abena focuses on building strong reading comprehension, essay writing, and critical thinking skills in her students across all levels.",
  },
  {
    id: "3",
    name: "Dr. Yaw Mensah",
    qualification: "PhD",
    subjects: ["Physics", "Mathematics", "Elective Mathematics"],
    experience_years: 12,
    bio: "Dr. Mensah brings over a decade of teaching and research experience to his tutoring sessions. His deep knowledge of physics and mathematics makes him particularly effective with SHS and university-level students.",
  },
  {
    id: "4",
    name: "Efua Boateng",
    qualification: "Bachelor's Degree",
    subjects: ["Biology", "Chemistry", "Science"],
    experience_years: 5,
    bio: "Efua graduated with a degree in Biochemistry and has been tutoring science subjects for five years. She uses visual aids and real-world examples to help students connect theory to practice.",
  },
  {
    id: "5",
    name: "Kofi Darko",
    qualification: "Master's Degree",
    subjects: ["Economics", "Business Studies", "Accounting"],
    experience_years: 6,
    bio: "With a Master's in Economics and experience in both academia and the private sector, Kofi brings a practical perspective to business education, helping students understand real economic principles.",
  },
  {
    id: "6",
    name: "Akosua Frimpong",
    qualification: "Bachelor's Degree",
    subjects: ["French", "English Language", "Social Studies"],
    experience_years: 3,
    bio: "Akosua studied Modern Languages and has tutored French from beginner to WASSCE level. Her conversational approach makes language learning enjoyable and effective for students of all ages.",
  },
  {
    id: "7",
    name: "Emmanuel Agyei",
    qualification: "HND",
    subjects: ["ICT / Computing", "Mathematics", "Science"],
    experience_years: 4,
    bio: "Emmanuel is a certified computing educator with hands-on industry experience. He makes ICT practical and relevant, covering everything from basic computer literacy to programming concepts for secondary students.",
  },
  {
    id: "8",
    name: "Adwoa Osei",
    qualification: "Bachelor's Degree",
    subjects: ["Geography", "History", "Religious & Moral Education"],
    experience_years: 5,
    bio: "Adwoa holds a degree in Social Sciences and has a gift for storytelling that brings history and geography to life. She is particularly effective with JHS students preparing for BECE.",
  },
];
