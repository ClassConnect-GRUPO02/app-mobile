import {Course} from "@/app/data/Course";

// cursos hardcodeados para ver el funcionamiento
export const courses: Course[] = [
    {
        id: "1",
        name: "Introducción a la Programación",
        shortDescription: "Fundamentos básicos de programación para principiantes",
        description:
            "Este curso está diseñado para estudiantes sin experiencia previa en programación. Aprenderás los conceptos fundamentales como variables, estructuras de control, funciones y más. Al finalizar, serás capaz de crear programas simples y entender la lógica de programación.",
        startDate: "2023-09-01",
        endDate: "2023-12-15",
        instructor: {
            name: "Dr. Carlos Mendoza",
            profile:
                "Doctor en Ciencias de la Computación con 15 años de experiencia enseñando programación a principiantes.",
        },
        capacity: 30,
        enrolled: 18,
        category: "Tecnología",
        level: "Principiante",
        modality: "Online",
        prerequisites: [],
        imageUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2062&auto=format&fit=crop",
    },
    {
        id: "2",
        name: "Desarrollo Web Avanzado",
        shortDescription: "Técnicas modernas de desarrollo frontend y backend",
        description:
            "Profundiza en el desarrollo web con frameworks modernos como React, Node.js y bases de datos NoSQL. Este curso está orientado a desarrolladores con experiencia básica que desean mejorar sus habilidades y construir aplicaciones web completas y escalables.",
        startDate: "2023-10-05",
        endDate: "2024-02-28",
        instructor: {
            name: "Ing. Laura Sánchez",
            profile: "Ingeniera de Software Senior con experiencia en startups y grandes empresas tecnológicas.",
        },
        capacity: 25,
        enrolled: 25,
        category: "Tecnología",
        level: "Avanzado",
        modality: "Híbrido",
        prerequisites: ["Conocimientos básicos de HTML, CSS y JavaScript", "Experiencia con algún framework de frontend"],
        imageUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2064&auto=format&fit=crop",
    },
    {
        id: "3",
        name: "Matemáticas para Data Science",
        shortDescription: "Fundamentos matemáticos para análisis de datos",
        description:
            "Aprende los conceptos matemáticos esenciales para Data Science: álgebra lineal, cálculo, probabilidad y estadística. El curso incluye aplicaciones prácticas utilizando Python y bibliotecas como NumPy y Pandas.",
        startDate: "2023-09-15",
        endDate: "2024-01-20",
        instructor: {
            name: "Dra. Elena Ramírez",
            profile: "Doctora en Matemáticas Aplicadas con especialización en Machine Learning.",
        },
        capacity: 40,
        enrolled: 22,
        category: "Ciencias",
        level: "Intermedio",
        modality: "Online",
        prerequisites: [
            "Conocimientos básicos de matemáticas universitarias",
            "Familiaridad con algún lenguaje de programación",
        ],
        imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop",
    },
    {
        id: "4",
        name: "Marketing Digital",
        shortDescription: "Estrategias efectivas para presencia online",
        description:
            "Domina las estrategias de marketing digital incluyendo SEO, SEM, redes sociales y email marketing. Aprenderás a crear campañas efectivas, analizar métricas y optimizar la presencia online de cualquier negocio.",
        startDate: "2023-08-10",
        endDate: "2023-11-30",
        instructor: {
            name: "Lic. Roberto Gómez",
            profile: "Especialista en Marketing Digital con experiencia en agencias internacionales.",
        },
        capacity: 35,
        enrolled: 30,
        category: "Negocios",
        level: "Intermedio",
        modality: "Online",
        prerequisites: ["Conocimientos básicos de marketing"],
        imageUrl: "https://images.unsplash.com/photo-1557838923-2985c318be48?q=80&w=2031&auto=format&fit=crop",
    },
    {
        id: "5",
        name: "Diseño UX/UI",
        shortDescription: "Principios de diseño centrado en el usuario",
        description:
            "Aprende a crear interfaces intuitivas y experiencias de usuario excepcionales. El curso cubre investigación de usuarios, wireframing, prototipado y evaluación de usabilidad con herramientas como Figma y Adobe XD.",
        startDate: "2023-09-20",
        endDate: "2024-01-15",
        instructor: {
            name: "Dis. Ana Martínez",
            profile: "Diseñadora UX/UI Senior con experiencia en productos digitales de alto impacto.",
        },
        capacity: 20,
        enrolled: 15,
        category: "Diseño",
        level: "Intermedio",
        modality: "Híbrido",
        prerequisites: ["Conocimientos básicos de diseño gráfico", "Familiaridad con herramientas de diseño digital"],
        isEnrolled: true,
        imageUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=2070&auto=format&fit=crop",
    },
    {
        id: "6",
        name: "Inteligencia Artificial Aplicada",
        shortDescription: "Implementación práctica de sistemas de IA",
        description:
            "Este curso te enseñará a implementar soluciones de IA en problemas reales. Cubriremos machine learning, deep learning y procesamiento de lenguaje natural con frameworks como TensorFlow y PyTorch.",
        startDate: "2023-10-10",
        endDate: "2024-03-15",
        instructor: {
            name: "Dr. Miguel Torres",
            profile: "Investigador en IA con múltiples publicaciones en conferencias internacionales.",
        },
        capacity: 25,
        enrolled: 10,
        category: "Tecnología",
        level: "Avanzado",
        modality: "Online",
        prerequisites: ["Programación avanzada en Python", "Conocimientos de estadística y álgebra lineal"],
        imageUrl: "https://images.unsplash.com/photo-1677442135136-760c813028c0?q=80&w=2070&auto=format&fit=crop",
    },
]

// defincion de categorias determinada por todos los cursos ingresados, usando map
export const categories = [...new Set(courses.map((course) => course.category))]

// los niveles y modalidades ya estan preestablecidos
export const levels = ["Principiante", "Intermedio", "Avanzado"]
export const modalities = ["Online", "Presencial", "Híbrido"]
