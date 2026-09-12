export const site = {
  name: "Qalinraac Academy",
  tagline: "Qalinku Waa Iftiinka Aqoonta.",
  shortDescription:
    "An independent, non-profit knowledge institution for modern education, research, professional writing, translation, skills development, and evidence-based consulting in Somalia and East Africa.",
  email: "info@qalinraac.academy",
  phone: "+252 61 000 0000",
  address: "Mogadishu, Somalia",
  social: {
    facebook: "#",
    twitter: "#",
    linkedin: "#",
    youtube: "#",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: { label: string; href: string; description?: string }[];
};

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Academic", href: "/academic" },
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "Research", href: "/research" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const aboutParagraphs = [
  "Qalinraac Academy is an independent, non-profit knowledge institution established in response to the growing need for quality research, modern education, professional writing, translation, skills development, and evidence-based consulting in Somalia and the wider East African region.",
  "The Academy brings together research, distance education, professional writing, translation, innovation, and advisory services under one knowledge-driven institution. Our work is guided by the belief that knowledge is the foundation of sustainable development and that research is an essential tool for understanding societal challenges and developing practical, effective solutions.",
  "Qalinraac Academy is committed to making quality education and reliable knowledge more accessible to students, researchers, professionals, educators, institutions, and communities. Through modern technology and innovative approaches, we provide flexible learning opportunities, research support, professional language services, skills development, and evidence-based solutions that respond to real-world needs.",
  "Our academic and research work focuses on strengthening a culture of research and knowledge production. We support researchers, students, universities, government institutions, private organizations, and development partners through research development, proposal writing, data analysis and interpretation, academic writing, research reporting, project development, and other professional research services.",
  "Through our Distance Education programs, Qalinraac Academy uses modern digital learning technologies to provide accessible and flexible education. Our learning opportunities include live online classes, recorded lessons, professional training, and skills development programs designed to support learners regardless of their location or schedule.",
  "We also provide professional writing, translation, editing, proofreading, and academic review services. Our language services include Somali–English and Arabic–Somali translation, professional writing, academic content development, and book-writing support, with a strong focus on accuracy, clarity, quality, and professional standards.",
  "Qalinraac Academy recognizes the growing importance of practical skills in today's rapidly changing world. We therefore support the development of skills in areas such as research, data analysis, project management, leadership, communication, academic writing, technology, strategic planning, and professional development.",
  "Our work is built around integrity, excellence, innovation, transparency, responsibility, evidence-based knowledge, and community service. We believe that meaningful development requires collaboration, continuous learning, innovation, and the responsible use of knowledge and technology.",
  "Qalinraac Academy seeks to build lasting partnerships with universities, research institutions, government agencies, private organizations, civil society organizations, international organizations, professionals, and development partners. Through collaboration, we aim to strengthen education, research, innovation, institutional capacity, and knowledge sharing across Somalia and East Africa.",
  "Our vision is to become a leading center for modern education, high-quality research, innovation, professional writing, translation, and evidence-based consulting in Somalia and East Africa.",
  "At Qalinraac Academy, we believe that knowledge should be accessible, research should create impact, and education should empower people to build a better future.",
];

export const values = [
  {
    title: "Integrity",
    description: "Honest, ethical practice in every service we deliver.",
  },
  {
    title: "Excellence",
    description: "High standards in education, research, and professional work.",
  },
  {
    title: "Innovation",
    description: "Modern technology and creative approaches to learning.",
  },
  {
    title: "Transparency",
    description: "Clear processes and accountable partnerships.",
  },
  {
    title: "Responsibility",
    description: "Care for learners, partners, and the communities we serve.",
  },
  {
    title: "Evidence-based knowledge",
    description: "Decisions and solutions grounded in research and data.",
  },
  {
    title: "Community service",
    description: "Knowledge that strengthens people and institutions.",
  },
];

export type ServiceSlug =
  | "distance-education"
  | "research"
  | "writing-translation"
  | "skills-development"
  | "consulting";

export const services: {
  slug: ServiceSlug;
  title: string;
  short: string;
  body: string[];
  highlights: string[];
}[] = [
  {
    slug: "distance-education",
    title: "Distance Education",
    short:
      "Flexible digital learning with live classes, recorded lessons, and professional training.",
    body: [
      "Through our Distance Education programs, Qalinraac Academy uses modern digital learning technologies to provide accessible and flexible education.",
      "Our learning opportunities include live online classes, recorded lessons, professional training, and skills development programs designed to support learners regardless of their location or schedule.",
    ],
    highlights: [
      "Live online classes",
      "Recorded lessons",
      "Professional training",
      "Skills programs",
      "Learn anywhere",
    ],
  },
  {
    slug: "research",
    title: "Research Services",
    short:
      "Research development, proposals, data analysis, academic writing, and reporting.",
    body: [
      "Our academic and research work focuses on strengthening a culture of research and knowledge production.",
      "We support researchers, students, universities, government institutions, private organizations, and development partners through research development, proposal writing, data analysis and interpretation, academic writing, research reporting, project development, and other professional research services.",
    ],
    highlights: [
      "Proposal writing",
      "Data analysis",
      "Academic writing",
      "Research reporting",
      "Project development",
    ],
  },
  {
    slug: "writing-translation",
    title: "Writing & Translation",
    short:
      "Professional writing, translation, editing, proofreading, and academic review.",
    body: [
      "We provide professional writing, translation, editing, proofreading, and academic review services.",
      "Our language services include Somali–English and Arabic–Somali translation, professional writing, academic content development, and book-writing support, with a strong focus on accuracy, clarity, quality, and professional standards.",
    ],
    highlights: [
      "Somali–English translation",
      "Arabic–Somali translation",
      "Editing & proofreading",
      "Academic review",
      "Book-writing support",
    ],
  },
  {
    slug: "skills-development",
    title: "Skills Development",
    short:
      "Practical skills for research, leadership, communication, technology, and more.",
    body: [
      "Qalinraac Academy recognizes the growing importance of practical skills in today's rapidly changing world.",
      "We support the development of skills in areas such as research, data analysis, project management, leadership, communication, academic writing, technology, strategic planning, and professional development.",
    ],
    highlights: [
      "Leadership",
      "Data analysis",
      "Project management",
      "Communication",
      "Strategic planning",
    ],
  },
  {
    slug: "consulting",
    title: "Evidence-based Consulting",
    short:
      "Advisory services that turn research and knowledge into practical solutions.",
    body: [
      "Qalinraac Academy provides evidence-based consulting that responds to real-world institutional and community needs.",
      "We partner with organizations to interpret challenges, design practical solutions, and strengthen capacity through knowledge, research, and professional expertise.",
    ],
    highlights: [
      "Institutional advisory",
      "Evidence-based solutions",
      "Capacity building",
      "Project support",
      "Knowledge partnerships",
    ],
  },
];

export const programs = [
  {
    title: "Professional Distance Learning",
    category: "Education",
    badge: "Featured",
    instructor: "Amina Hassan",
    rating: 4.9,
    learners: "1.2k",
    description:
      "Structured online courses with live sessions, recorded lessons, and progressive assessments.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Research Methods & Reporting",
    category: "Research",
    badge: "Popular",
    instructor: "Dr. Omar Ali",
    rating: 4.8,
    learners: "860",
    description:
      "Practical training in research design, data interpretation, academic writing, and reporting.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Academic Writing Mastery",
    category: "Writing",
    badge: "New",
    instructor: "Layla Mohamed",
    rating: 4.7,
    learners: "940",
    description:
      "Strengthen clarity, structure, and standards in academic and professional writing.",
    image:
      "https://images.unsplash.com/photo-1456513080080-7e9d11d0a4d3?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Translation Practice Lab",
    category: "Language",
    badge: "Featured",
    instructor: "Hodan Yusuf",
    rating: 4.9,
    learners: "720",
    description:
      "Hands-on Somali–English and Arabic–Somali translation with quality review workflows.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Leadership & Communication",
    category: "Skills",
    badge: "Popular",
    instructor: "Abdi Nur",
    rating: 4.8,
    learners: "1.1k",
    description:
      "Build leadership presence, professional communication, and team coordination skills.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Project & Strategy Essentials",
    category: "Development",
    badge: "New",
    instructor: "Fadumo Said",
    rating: 4.6,
    learners: "640",
    description:
      "Project management, strategic planning, and professional development for practitioners.",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
  },
];

export const instructors = [
  {
    name: "Dr. Omar Ali",
    role: "Research Lead",
    rating: 4.9,
    courses: 12,
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Amina Hassan",
    role: "Distance Education",
    rating: 4.8,
    courses: 9,
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Hodan Yusuf",
    role: "Language Services",
    rating: 4.9,
    courses: 7,
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Abdi Nur",
    role: "Skills & Leadership",
    rating: 4.7,
    courses: 8,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
  },
];

export const valueProps = [
  {
    title: "Expert instructors",
    description: "Learn from respected educators and practitioners.",
  },
  {
    title: "Flexible learning",
    description: "Live classes and recorded lessons on your schedule.",
  },
  {
    title: "Research support",
    description: "From proposals to data analysis and reporting.",
  },
  {
    title: "Verified certificates",
    description: "Recognized credentials for completed programs.",
  },
];

export const faqs = [
  {
    q: "What is Qalinraac Academy?",
    a: "Qalinraac Academy is an independent, non-profit knowledge institution offering distance education, research services, professional writing, translation, skills development, and evidence-based consulting across Somalia and East Africa.",
  },
  {
    q: "Who can learn with you?",
    a: "Students, researchers, professionals, educators, institutions, and communities seeking flexible, high-quality learning and knowledge services.",
  },
  {
    q: "Are programs fully online?",
    a: "Yes. Our Distance Education programs use modern digital learning technologies, including live online classes and recorded lessons, so you can learn from anywhere.",
  },
  {
    q: "Do you offer translation services?",
    a: "Yes. We provide Somali–English and Arabic–Somali translation, plus editing, proofreading, academic review, and book-writing support.",
  },
  {
    q: "How can institutions partner with you?",
    a: "We welcome partnerships with universities, research institutions, government agencies, private organizations, civil society, and development partners. Reach us through the Contact page.",
  },
  {
    q: "How do I start learning?",
    a: "Create a student account, explore available programs, enroll, and begin learning through your dashboard.",
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
