export interface Testimonial {
  id: string;
  name: string;
  role: string;
  subject: string;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Abena Asante",
    role: "Parent of JHS 2 Student",
    subject: "Mathematics",
    quote:
      "My daughter went from failing maths to scoring 85% in her end-of-term exam. The tutor was patient, structured, and genuinely cared about her progress. Inspired Minds made the whole process effortless.",
  },
  {
    id: "2",
    name: "Kofi Mensah",
    role: "SHS 3 Student",
    subject: "Physics & Chemistry",
    quote:
      "My tutor broke down difficult WASSCE concepts in a way I could actually understand. I passed all my electives and got into my first-choice university programme. Highly recommend!",
  },
  {
    id: "3",
    name: "Efua Owusu",
    role: "Parent of Primary 5 Student",
    subject: "English & Science",
    quote:
      "Finding a reliable tutor in our area used to be a nightmare. Inspired Minds matched us within days and our son is now reading confidently and loves his science lessons.",
  },
  {
    id: "4",
    name: "Nana Ama Boateng",
    role: "University Freshman",
    subject: "Calculus",
    quote:
      "University maths was overwhelming at first. My tutor helped me build a solid foundation quickly and I'm now one of the top students in my class. Worth every cedi.",
  },
  {
    id: "5",
    name: "Emmanuel Darko",
    role: "Parent of JHS 3 Student",
    subject: "Mathematics & Science",
    quote:
      "The BECE results exceeded our expectations. Our son improved dramatically in both maths and science. The tutor was punctual, professional, and always prepared.",
  },
  {
    id: "6",
    name: "Akosua Frimpong",
    role: "SHS 2 Student",
    subject: "Economics",
    quote:
      "I had a poor understanding of economics but my tutor made it relatable and interesting. My grades improved significantly and I now actually enjoy the subject!",
  },
];
