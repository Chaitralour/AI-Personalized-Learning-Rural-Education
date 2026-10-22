import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState(
    () => localStorage.getItem("ruralEduStudent") || ""
  );
  const [loginUsername, setLoginUsername] = useState(
    () => localStorage.getItem("ruralEduStudent") || ""
  );
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [teacherData, setTeacherData] = useState({ loading: false, error: "", students: [], attempts: [] });
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherMaterials, setTeacherMaterials] = useState([]);
  const [materialSubject, setMaterialSubject] = useState("Science");
  const [materialTopic, setMaterialTopic] = useState("Refraction");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialFile, setMaterialFile] = useState(null);
  const [materialMessage, setMaterialMessage] = useState("");
  const [materialBusy, setMaterialBusy] = useState(false);
  const [topicMaterials, setTopicMaterials] = useState([]);
  const [topicMaterialsLoading, setTopicMaterialsLoading] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  // AI states
  const [showAI, setShowAI] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Quiz states
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  // Student performance / marks
const [marks, setMarks] = useState(() => {
  const savedMarks = localStorage.getItem("ruralEduMarks");
  return savedMarks ? JSON.parse(savedMarks) : [];
});   
  const handleLogin = async (role) => {
  const email = loginUsername.trim();
  const password = loginPassword;

  if (!email || !password) {
    setLoginError("Please enter your email and password.");
    return;
  }

  setIsLoading(true);
  setLoginError("");

  try {
    const response = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setLoginError(data.message || "Login failed.");
      return;
    }

    const user = data.user;
    const requestedRole = role.toLowerCase();

    if (user.role !== requestedRole) {
      setLoginError(`This account is registered as ${user.role}. Please choose the correct login role.`);
      return;
    }

    setUsername(user.name);
    setUserRole(user.role.charAt(0).toUpperCase() + user.role.slice(1));
    setIsLoggedIn(true);
    if (requestedRole === "teacher") {
      loadTeacherDashboard();
    }

    localStorage.setItem("ruralEduStudent", user.name);
    localStorage.setItem("ruralEduUser", JSON.stringify(user));
    setLoginUsername(user.email);
    setLoginPassword("");
  } catch (error) {
    setLoginError(
      "Cannot connect to the server. Make sure Flask is running."
    );
  } finally {
    setIsLoading(false);
  }
};
const handleRegister = async () => {
  const name = registerName.trim();
  const email = registerEmail.trim();
  const password = registerPassword;

  if (!name || !email || !password) {
    setRegisterMessage("Please fill in all fields.");
    return;
  }

  if (password.length < 8) {
    setRegisterMessage("Password must contain at least 8 characters.");
    return;
  }

  setIsLoading(true);
  setRegisterMessage("");

  try {
    const response = await fetch("http://127.0.0.1:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setRegisterMessage(data.message || "Registration failed.");
      return;
    }

    setRegisterMessage("Account created successfully! You can now log in.");

    setLoginUsername(email);
    setLoginPassword("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setShowRegister(false);
  } catch (error) {
    setRegisterMessage(
      "Cannot connect to Flask. Make sure the backend is running."
    );
  } finally {
    setIsLoading(false);
  }
};
  const handleLogout = () => {
    localStorage.removeItem("ruralEduUser");
    localStorage.removeItem("ruralEduStudent");
    setTeacherData({ loading: false, error: "", students: [], attempts: [] });
    setIsLoggedIn(false);
    setUserRole("");
    setSelectedSubject(null);
    setSelectedTopic(null);
    setShowAI(false);
    setShowQuiz(false);
    setQuestion("");
    setAnswer("");
    setSelectedAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
  };
  const loadTeacherDashboard = async () => {
    setTeacherData((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const response = await fetch("http://127.0.0.1:5000/api/teacher/dashboard");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load teacher dashboard.");
      }
      setTeacherData({
        loading: false,
        error: "",
        students: data.students || [],
        attempts: data.attempts || [],
      });
    } catch (error) {
      setTeacherData((previous) => ({
        ...previous,
        loading: false,
        error: error.message || "Could not connect to Flask.",
      }));
    }
  };

  const loadTeacherMaterials = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/materials");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load materials.");
      setTeacherMaterials(data.materials || []);
    } catch (error) {
      setMaterialMessage(error.message || "Could not load learning materials.");
    }
  };

  const uploadLearningMaterial = async (event) => {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem("ruralEduUser") || "null");
    if (!user || user.role !== "teacher") {
      setMaterialMessage("Please log in with a teacher account to upload materials.");
      return;
    }
    if (!materialTitle.trim() || !materialFile) {
      setMaterialMessage("Enter a title and choose a PDF file.");
      return;
    }
    if (materialFile.type !== "application/pdf" && !materialFile.name.toLowerCase().endsWith(".pdf")) {
      setMaterialMessage("Only PDF files are allowed.");
      return;
    }
    const formData = new FormData();
    formData.append("teacher_id", user.id);
    formData.append("subject_name", materialSubject);
    formData.append("topic_name", materialTopic);
    formData.append("title", materialTitle.trim());
    formData.append("file", materialFile);
    setMaterialBusy(true);
    setMaterialMessage("");
    try {
      const response = await fetch("http://127.0.0.1:5000/api/materials", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Upload failed.");
      setMaterialMessage("PDF uploaded successfully.");
      setMaterialTitle("");
      setMaterialFile(null);
      const fileInput = document.getElementById("ruraledu-pdf-file");
      if (fileInput) fileInput.value = "";
      await loadTeacherMaterials();
    } catch (error) {
      setMaterialMessage(error.message || "Unable to upload PDF.");
    } finally {
      setMaterialBusy(false);
    }
  };

  const deleteLearningMaterial = async (materialId) => {
    const user = JSON.parse(localStorage.getItem("ruralEduUser") || "null");
    if (!user || !window.confirm("Delete this learning material?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/materials/${materialId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: user.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Delete failed.");
      setMaterialMessage("Learning material deleted.");
      await loadTeacherMaterials();
    } catch (error) {
      setMaterialMessage(error.message || "Unable to delete material.");
    }
  };

  useEffect(() => {
    if (isLoggedIn && userRole === "Teacher") {
      loadTeacherMaterials();
    }
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    if (!selectedTopic || userRole !== "Student") return;
    let cancelled = false;
    const loadTopicMaterials = async () => {
      setTopicMaterialsLoading(true);
      try {
        const subjectName = selectedSubject?.name || "";
        const response = await fetch(`http://127.0.0.1:5000/api/materials?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(selectedTopic)}`);
        const data = await response.json();
        if (!cancelled) setTopicMaterials(response.ok && data.success ? (data.materials || []) : []);
      } catch {
        if (!cancelled) setTopicMaterials([]);
      } finally {
        if (!cancelled) setTopicMaterialsLoading(false);
      }
    };
    loadTopicMaterials();
    return () => { cancelled = true; };
  }, [selectedTopic, selectedSubject, userRole]);

  // --------------------------------------------------
  // SUBJECTS AND TOPICS
  // --------------------------------------------------

  const subjects = [
    {
      name: "Science",
      icon: "🔬",
      description:
        "Explore concepts through simple explanations and practice.",
      topics: [
        "Matter and Its Properties",
        "Force and Motion",
        "Work, Energy and Power",
        "Light",
        "Refraction",
        "Electricity",
        "Sound",
        "Environment and Ecosystems",
      ],
    },
    {
      name: "Computer Science",
      icon: "💻",
      description: "Learn programming and computer fundamentals.",
      topics: [
        "Computer Fundamentals",
        "Number Systems",
        "Programming Basics",
        "Data Structures",
        "Algorithms",
        "Database Fundamentals",
        "Computer Networks",
        "Operating Systems",
      ],
    },
    {
      name: "Mathematics",
      icon: "📐",
      description:
        "Practice concepts and strengthen your problem-solving skills.",
      topics: [
        "Algebra",
        "Linear Equations",
        "Geometry",
        "Trigonometry",
        "Probability",
        "Statistics",
        "Mensuration",
        "Basic Calculus",
      ],
    },
  ];

  // --------------------------------------------------
  // TOPIC DATA
  // Each topic has its own learning content + quiz
  // --------------------------------------------------

  const topicData = {
    "Matter and Its Properties": {
      explanation:
        "Matter is anything that has mass and occupies space. Matter commonly exists as solids, liquids and gases.",
      example:
        "Water can exist as ice, liquid water and water vapour depending on temperature.",
      keyPoints: [
        "Matter has mass.",
        "Matter occupies space.",
        "The common states are solid, liquid and gas.",
        "Heating and cooling can change the state of matter.",
      ],
      questions: [
        {
          question: "Which of the following is matter?",
          options: ["Light", "Sound", "Water", "Heat"],
          answer: "Water",
        },
        {
          question: "Which state of matter has a fixed shape?",
          options: ["Solid", "Liquid", "Gas", "Plasma"],
          answer: "Solid",
        },
        {
          question: "What happens to water when it freezes?",
          options: [
            "It becomes a solid",
            "It becomes a gas",
            "It disappears",
            "It becomes plasma",
          ],
          answer: "It becomes a solid",
        },
        {
          question: "Which state of matter takes the shape of its container?",
          options: ["Solid", "Liquid", "Crystal", "Metal"],
          answer: "Liquid",
        },
        {
          question: "Water vapour is an example of:",
          options: ["Solid", "Liquid", "Gas", "Metal"],
          answer: "Gas",
        },
      ],
    },

    "Force and Motion": {
      explanation:
        "Force is a push or pull that can change the motion, direction or shape of an object.",
      example:
        "When you kick a football, your foot applies a force that changes the motion of the ball.",
      keyPoints: [
        "Force is a push or pull.",
        "Force can change motion.",
        "Force can change direction.",
        "Force can change the shape of an object.",
      ],
      questions: [
        {
          question: "What is force?",
          options: ["A push or pull", "Only heat", "Only sound", "Light"],
          answer: "A push or pull",
        },
        {
          question: "Which force pulls objects toward Earth?",
          options: ["Friction", "Gravity", "Magnetism", "Tension"],
          answer: "Gravity",
        },
        {
          question: "What can force change?",
          options: [
            "Only colour",
            "Only temperature",
            "Motion or shape",
            "Only mass",
          ],
          answer: "Motion or shape",
        },
        {
          question: "Which force opposes motion between surfaces?",
          options: ["Gravity", "Friction", "Magnetism", "Buoyancy"],
          answer: "Friction",
        },
        {
          question: "Speed describes how fast an object:",
          options: ["Moves", "Heats", "Grows", "Changes colour"],
          answer: "Moves",
        },
      ],
    },

    "Work, Energy and Power": {
      explanation:
        "Work is done when a force causes an object to move. Energy is the capacity to do work, while power describes how quickly work is done.",
      example:
        "Lifting a school bag from the floor to a table involves doing work against gravity.",
      keyPoints: [
        "Work involves force and displacement.",
        "Energy is the capacity to do work.",
        "Kinetic energy is associated with motion.",
        "Power is the rate at which work is done.",
      ],
      questions: [
        {
          question: "What is required for mechanical work to be done?",
          options: [
            "Force and displacement",
            "Only colour",
            "Only temperature",
            "Only mass",
          ],
          answer: "Force and displacement",
        },
        {
          question: "Energy associated with motion is:",
          options: [
            "Potential energy",
            "Kinetic energy",
            "Chemical energy",
            "Sound energy",
          ],
          answer: "Kinetic energy",
        },
        {
          question: "Power is the rate of:",
          options: [
            "Change in colour",
            "Doing work",
            "Change in mass",
            "Change in temperature",
          ],
          answer: "Doing work",
        },
        {
          question: "Stored energy due to position is:",
          options: [
            "Kinetic energy",
            "Potential energy",
            "Sound energy",
            "Light energy",
          ],
          answer: "Potential energy",
        },
        {
          question: "Which unit is commonly used for energy?",
          options: ["Joule", "Watt", "Newton", "Pascal"],
          answer: "Joule",
        },
      ],
    },

    Light: {
      explanation:
        "Light is a form of electromagnetic radiation that allows us to see objects. It travels in straight lines in a uniform medium.",
      example:
        "A torch produces light that travels outward and allows nearby objects to be seen.",
      keyPoints: [
        "Light is a form of electromagnetic radiation.",
        "Light enables vision.",
        "Light generally travels in straight lines in a uniform medium.",
        "Light can be reflected and refracted.",
      ],
      questions: [
        {
          question: "What allows us to see objects?",
          options: ["Light", "Sound", "Heat", "Pressure"],
          answer: "Light",
        },
        {
          question: "How does light generally travel in a uniform medium?",
          options: [
            "In straight lines",
            "In circles",
            "Randomly",
            "Only upward",
          ],
          answer: "In straight lines",
        },
        {
          question: "Bouncing of light from a surface is called:",
          options: ["Refraction", "Reflection", "Absorption", "Diffusion"],
          answer: "Reflection",
        },
        {
          question: "Bending of light between media is called:",
          options: ["Reflection", "Refraction", "Emission", "Absorption"],
          answer: "Refraction",
        },
        {
          question: "Which is a natural source of light?",
          options: ["Sun", "Book", "Chair", "Table"],
          answer: "Sun",
        },
      ],
    },

    Refraction: {
      explanation:
        "Refraction is the bending of light when it passes from one transparent medium to another. This happens because the speed of light changes when it enters a different medium.",
      example:
        "A pencil placed in a glass of water may appear bent at the point where it enters the water.",
      keyPoints: [
        "Refraction occurs when light moves between different media.",
        "The speed of light changes in the new medium.",
        "The change in speed causes light to change direction.",
        "Water, glass and air are common transparent media.",
      ],
      questions: [
        {
          question: "What is refraction?",
          options: [
            "Bending of light",
            "Reflection of sound",
            "Production of heat",
            "Absorption of light",
          ],
          answer: "Bending of light",
        },
        {
          question: "Why does light bend during refraction?",
          options: [
            "Its color changes",
            "Its speed changes",
            "It disappears",
            "It becomes sound",
          ],
          answer: "Its speed changes",
        },
        {
          question: "Which of these can cause refraction?",
          options: ["Air to water", "Water to water", "Air to air", "Vacuum to vacuum"],
          answer: "Air to water",
        },
        {
          question: "A pencil appears bent when placed in water because of:",
          options: ["Reflection", "Refraction", "Diffraction", "Absorption"],
          answer: "Refraction",
        },
        {
          question: "Which property changes when light enters another medium?",
          options: ["Speed", "Mass", "Temperature", "Electric charge"],
          answer: "Speed",
        },
      ],
    },

    Electricity: {
      explanation:
        "Electricity involves the movement of electric charge. Electric circuits provide a path through which electric current can flow.",
      example:
        "A battery connected to a bulb through wires can form a simple electric circuit.",
      keyPoints: [
        "Electric current involves movement of charge.",
        "A closed circuit allows current to flow.",
        "A battery can provide electrical energy.",
        "Conductors allow electric current to pass easily.",
      ],
      questions: [
        {
          question: "What flows through an electric circuit?",
          options: ["Electric current", "Water", "Sound", "Air"],
          answer: "Electric current",
        },
        {
          question: "Which device can provide electrical energy in a simple circuit?",
          options: ["Battery", "Mirror", "Lens", "Ruler"],
          answer: "Battery",
        },
        {
          question: "Current can flow through a:",
          options: ["Closed circuit", "Broken circuit", "Plastic wall", "Vacuum only"],
          answer: "Closed circuit",
        },
        {
          question: "Which material generally conducts electricity well?",
          options: ["Copper", "Rubber", "Wood", "Plastic"],
          answer: "Copper",
        },
        {
          question: "The SI unit of electric current is:",
          options: ["Ampere", "Volt", "Watt", "Ohm"],
          answer: "Ampere",
        },
      ],
    },

    Sound: {
      explanation:
        "Sound is produced by vibrating objects and travels through a medium such as air, water or solids.",
      example:
        "When a guitar string vibrates, it produces sound that travels through the surrounding air.",
      keyPoints: [
        "Sound is produced by vibrations.",
        "Sound requires a medium to travel.",
        "Sound can travel through solids, liquids and gases.",
        "Frequency is related to the pitch of sound.",
      ],
      questions: [
        {
          question: "What produces sound?",
          options: ["Vibrations", "Light", "Electric charge only", "Gravity"],
          answer: "Vibrations",
        },
        {
          question: "Sound requires what to travel?",
          options: ["A medium", "Only sunlight", "A vacuum", "No material"],
          answer: "A medium",
        },
        {
          question: "Which property is related to pitch?",
          options: ["Frequency", "Mass", "Temperature", "Density only"],
          answer: "Frequency",
        },
        {
          question: "Can sound travel through water?",
          options: ["Yes", "No", "Only in vacuum", "Only through light"],
          answer: "Yes",
        },
        {
          question: "Sound cannot normally travel through:",
          options: ["Vacuum", "Air", "Water", "Steel"],
          answer: "Vacuum",
        },
      ],
    },

    "Environment and Ecosystems": {
      explanation:
        "An ecosystem consists of living organisms and the non-living components interacting with one another in an environment.",
      example:
        "A pond ecosystem contains plants, fish, microorganisms, water, sunlight and soil.",
      keyPoints: [
        "Ecosystems contain living and non-living components.",
        "Plants are important producers.",
        "Animals can act as consumers.",
        "Decomposers break down dead organic matter.",
      ],
      questions: [
        {
          question: "What is an ecosystem?",
          options: [
            "Living and non-living components interacting",
            "Only animals",
            "Only plants",
            "Only water",
          ],
          answer: "Living and non-living components interacting",
        },
        {
          question: "Plants are generally:",
          options: ["Producers", "Consumers", "Decomposers", "Predators"],
          answer: "Producers",
        },
        {
          question: "Which is a non-living component?",
          options: ["Water", "Fish", "Tree", "Bird"],
          answer: "Water",
        },
        {
          question: "Decomposers help break down:",
          options: [
            "Dead organic matter",
            "Sunlight",
            "Rocks only",
            "Clouds",
          ],
          answer: "Dead organic matter",
        },
        {
          question: "Which is an example of an ecosystem?",
          options: ["Pond", "Book", "Chair", "Computer"],
          answer: "Pond",
        },
      ],
    },

    // --------------------------------------------------
    // COMPUTER SCIENCE
    // --------------------------------------------------

    "Computer Fundamentals": {
      explanation:
        "Computer fundamentals cover the basic components and operations of computers, including hardware, software, input, processing and output.",
      example:
        "A keyboard provides input, the CPU processes information, and a monitor displays the output.",
      keyPoints: [
        "Hardware refers to physical computer components.",
        "Software consists of programs and instructions.",
        "CPU performs processing.",
        "Input and output devices allow interaction with computers.",
      ],
      questions: [
        {
          question: "Which component performs processing?",
          options: ["CPU", "Monitor", "Keyboard", "Speaker"],
          answer: "CPU",
        },
        {
          question: "Which is an input device?",
          options: ["Keyboard", "Monitor", "Printer", "Speaker"],
          answer: "Keyboard",
        },
        {
          question: "Which is hardware?",
          options: ["Keyboard", "Operating system", "Browser software", "Program"],
          answer: "Keyboard",
        },
        {
          question: "Which device displays visual output?",
          options: ["Monitor", "Keyboard", "Mouse", "Microphone"],
          answer: "Monitor",
        },
        {
          question: "Software consists mainly of:",
          options: [
            "Programs and instructions",
            "Physical wires",
            "Metal parts",
            "Plastic components",
          ],
          answer: "Programs and instructions",
        },
      ],
    },

    "Number Systems": {
      explanation:
        "Number systems are methods of representing numbers. Computers commonly use binary, while decimal is used in everyday calculations.",
      example:
        "The decimal number 5 is represented as 101 in binary.",
      keyPoints: [
        "Decimal uses base 10.",
        "Binary uses base 2.",
        "Computers use binary representation.",
        "Hexadecimal uses base 16.",
      ],
      questions: [
        {
          question: "Which number system uses base 2?",
          options: ["Binary", "Decimal", "Octal", "Hexadecimal"],
          answer: "Binary",
        },
        {
          question: "Which number system uses base 10?",
          options: ["Decimal", "Binary", "Octal", "Hexadecimal"],
          answer: "Decimal",
        },
        {
          question: "Binary uses which digits?",
          options: ["0 and 1", "1 and 2", "0 to 9", "A to F"],
          answer: "0 and 1",
        },
        {
          question: "Hexadecimal has base:",
          options: ["16", "2", "8", "10"],
          answer: "16",
        },
        {
          question: "Decimal 5 in binary is:",
          options: ["101", "100", "110", "111"],
          answer: "101",
        },
      ],
    },

    "Programming Basics": {
      explanation:
        "Programming involves writing instructions that a computer can execute. Variables, conditions, loops and functions are fundamental programming concepts.",
      example:
        "A program can use an if statement to check whether a student's marks are above a certain value.",
      keyPoints: [
        "Programs contain instructions.",
        "Variables store values.",
        "Conditions allow decisions.",
        "Loops repeat instructions.",
      ],
      questions: [
        {
          question: "What is used to store a value in a program?",
          options: ["Variable", "Monitor", "Keyboard", "Printer"],
          answer: "Variable",
        },
        {
          question: "Which construct is used for decision making?",
          options: ["if", "loop", "print", "comment"],
          answer: "if",
        },
        {
          question: "Which construct repeats instructions?",
          options: ["Loop", "Variable", "Comment", "String"],
          answer: "Loop",
        },
        {
          question: "A function is generally used to:",
          options: [
            "Group reusable instructions",
            "Display hardware",
            "Store electricity",
            "Connect a monitor",
          ],
          answer: "Group reusable instructions",
        },
        {
          question: "Which is a programming language?",
          options: ["Python", "Windows", "Chrome", "Keyboard"],
          answer: "Python",
        },
      ],
    },

    "Data Structures": {
      explanation:
        "Data structures organize and store data so that it can be accessed and processed efficiently.",
      example:
        "An array can store a collection of marks for multiple students.",
      keyPoints: [
        "Data structures organize data.",
        "Arrays store elements in an ordered structure.",
        "Stacks follow LIFO.",
        "Queues follow FIFO.",
      ],
      questions: [
        {
          question: "Which principle does a stack follow?",
          options: ["LIFO", "FIFO", "Random", "Priority only"],
          answer: "LIFO",
        },
        {
          question: "Which principle does a queue follow?",
          options: ["FIFO", "LIFO", "Random", "Reverse only"],
          answer: "FIFO",
        },
        {
          question: "Which structure stores elements sequentially?",
          options: ["Array", "Compiler", "Operating system", "Router"],
          answer: "Array",
        },
        {
          question: "What does LIFO mean?",
          options: [
            "Last In First Out",
            "Last In First Open",
            "Low Input First Output",
            "List In File Order",
          ],
          answer: "Last In First Out",
        },
        {
          question: "What does FIFO mean?",
          options: [
            "First In First Out",
            "First Input File Output",
            "Fast Input Fast Output",
            "File In File Out",
          ],
          answer: "First In First Out",
        },
      ],
    },

    Algorithms: {
      explanation:
        "An algorithm is a step-by-step procedure for solving a problem or completing a task.",
      example:
        "A sorting algorithm can arrange a list of student marks from smallest to largest.",
      keyPoints: [
        "Algorithms provide steps to solve problems.",
        "Algorithms should be clear and finite.",
        "Searching and sorting are common algorithmic tasks.",
        "Different algorithms can have different efficiencies.",
      ],
      questions: [
        {
          question: "What is an algorithm?",
          options: [
            "A step-by-step problem-solving procedure",
            "A hardware device",
            "A database",
            "A network cable",
          ],
          answer: "A step-by-step problem-solving procedure",
        },
        {
          question: "Which is a sorting algorithm?",
          options: ["Bubble Sort", "Binary Search", "BFS", "DFS"],
          answer: "Bubble Sort",
        },
        {
          question: "Which algorithm is used to search a sorted array efficiently?",
          options: ["Binary Search", "Bubble Sort", "Selection Sort", "Insertion Sort"],
          answer: "Binary Search",
        },
        {
          question: "Algorithms are mainly designed to:",
          options: [
            "Solve problems",
            "Increase screen size",
            "Store electricity",
            "Replace hardware",
          ],
          answer: "Solve problems",
        },
        {
          question: "Algorithm efficiency is commonly discussed using:",
          options: [
            "Time and space complexity",
            "Screen resolution",
            "File colour",
            "Keyboard size",
          ],
          answer: "Time and space complexity",
        },
      ],
    },

    "Database Fundamentals": {
      explanation:
        "A database is an organized collection of data. Database systems provide methods for storing, retrieving and managing information.",
      example:
        "A college database can store student names, IDs, courses and marks.",
      keyPoints: [
        "Databases organize data.",
        "Tables contain rows and columns in relational databases.",
        "SQL is commonly used with relational databases.",
        "A primary key uniquely identifies records.",
      ],
      questions: [
        {
          question: "What is a database?",
          options: [
            "Organized collection of data",
            "A programming language",
            "A monitor",
            "A network cable",
          ],
          answer: "Organized collection of data",
        },
        {
          question: "Which language is commonly used with relational databases?",
          options: ["SQL", "HTML", "CSS", "Python only"],
          answer: "SQL",
        },
        {
          question: "A relational database stores data mainly in:",
          options: ["Tables", "Images only", "Folders only", "Networks"],
          answer: "Tables",
        },
        {
          question: "What uniquely identifies a record?",
          options: ["Primary key", "Password", "Table name", "Database name"],
          answer: "Primary key",
        },
        {
          question: "Which SQL command retrieves data?",
          options: ["SELECT", "DELETE", "DROP", "CREATE"],
          answer: "SELECT",
        },
      ],
    },

    "Computer Networks": {
      explanation:
        "A computer network connects devices so that they can communicate and share resources.",
      example:
        "A home Wi-Fi network connects phones, laptops and other devices to communicate and access the internet.",
      keyPoints: [
        "Networks connect computing devices.",
        "Devices communicate using protocols.",
        "The internet is a large network of interconnected networks.",
        "Routers help forward data between networks.",
      ],
      questions: [
        {
          question: "What is a computer network?",
          options: [
            "Connected devices that communicate",
            "A single keyboard",
            "A programming language",
            "A database table",
          ],
          answer: "Connected devices that communicate",
        },
        {
          question: "Which device forwards packets between networks?",
          options: ["Router", "Keyboard", "Monitor", "Printer"],
          answer: "Router",
        },
        {
          question: "What does LAN stand for?",
          options: [
            "Local Area Network",
            "Large Access Node",
            "Linked Application Network",
            "Local Application Node",
          ],
          answer: "Local Area Network",
        },
        {
          question: "Which is used for wireless networking?",
          options: ["Wi-Fi", "SQL", "HTML", "USB only"],
          answer: "Wi-Fi",
        },
        {
          question: "The Internet is best described as:",
          options: [
            "A network of networks",
            "A single computer",
            "A database",
            "A programming language",
          ],
          answer: "A network of networks",
        },
      ],
    },

    "Operating Systems": {
      explanation:
        "An operating system manages computer hardware and provides services for application programs and users.",
      example:
        "Windows manages memory, files, devices and applications running on a computer.",
      keyPoints: [
        "Operating systems manage hardware resources.",
        "They provide an interface for users and applications.",
        "They manage processes and memory.",
        "They manage files and storage.",
      ],
      questions: [
        {
          question: "What does an operating system manage?",
          options: [
            "Computer resources",
            "Only the keyboard",
            "Only websites",
            "Only images",
          ],
          answer: "Computer resources",
        },
        {
          question: "Which is an operating system?",
          options: ["Windows", "HTML", "MySQL", "Chrome"],
          answer: "Windows",
        },
        {
          question: "Which resource does an OS manage?",
          options: ["Memory", "Only screen colour", "Only websites", "Only emails"],
          answer: "Memory",
        },
        {
          question: "Which is a function of an operating system?",
          options: ["File management", "Making food", "Printing books", "Building hardware"],
          answer: "File management",
        },
        {
          question: "A running program is commonly called a:",
          options: ["Process", "Table", "Router", "Packet"],
          answer: "Process",
        },
      ],
    },

    // --------------------------------------------------
    // MATHEMATICS
    // --------------------------------------------------

    Algebra: {
      explanation:
        "Algebra uses symbols and variables to represent numbers and relationships between quantities.",
      example:
        "In x + 5 = 10, x represents the unknown number 5.",
      keyPoints: [
        "Variables represent unknown or changing values.",
        "Expressions contain numbers, variables and operators.",
        "Equations state that two expressions are equal.",
        "Algebra is used to model relationships.",
      ],
      questions: [
        {
          question: "What does a variable represent?",
          options: ["A value", "Only a symbol with no meaning", "A colour", "A shape"],
          answer: "A value",
        },
        {
          question: "What is the value of x in x + 5 = 10?",
          options: ["5", "10", "15", "2"],
          answer: "5",
        },
        {
          question: "Which is an algebraic expression?",
          options: ["2x + 3", "Only 5", "A picture", "A sentence only"],
          answer: "2x + 3",
        },
        {
          question: "An equation contains an:",
          options: ["Equality relationship", "Image", "Audio file", "Network"],
          answer: "Equality relationship",
        },
        {
          question: "If x = 3, what is 2x?",
          options: ["6", "5", "3", "9"],
          answer: "6",
        },
      ],
    },

    "Linear Equations": {
      explanation:
        "A linear equation is an equation in which the variable has a maximum power of one.",
      example:
        "The equation 2x + 3 = 9 is a simple linear equation.",
      keyPoints: [
        "Linear equations have variables of degree one.",
        "They can be solved using algebraic operations.",
        "The variable represents an unknown value.",
        "A linear equation can have one solution in a simple case.",
      ],
      questions: [
        {
          question: "What is the solution of x + 4 = 9?",
          options: ["5", "4", "13", "3"],
          answer: "5",
        },
        {
          question: "What is the solution of 2x = 10?",
          options: ["5", "10", "20", "2"],
          answer: "5",
        },
        {
          question: "Which is a linear equation?",
          options: ["2x + 3 = 7", "x² = 4", "x³ = 8", "1/x = 2"],
          answer: "2x + 3 = 7",
        },
        {
          question: "If 3x = 12, x is:",
          options: ["4", "3", "9", "36"],
          answer: "4",
        },
        {
          question: "What operation can isolate x in 2x = 8?",
          options: ["Divide by 2", "Multiply by 2", "Add 2", "Subtract 8"],
          answer: "Divide by 2",
        },
      ],
    },

    Geometry: {
      explanation:
        "Geometry is the study of shapes, sizes, angles, distances and spatial relationships.",
      example:
        "A triangle has three sides and three angles.",
      keyPoints: [
        "Geometry studies shapes and spatial relationships.",
        "A triangle has three sides.",
        "A rectangle has four sides.",
        "Angles are measured in degrees.",
      ],
      questions: [
        {
          question: "How many sides does a triangle have?",
          options: ["3", "4", "5", "6"],
          answer: "3",
        },
        {
          question: "How many sides does a rectangle have?",
          options: ["4", "3", "5", "6"],
          answer: "4",
        },
        {
          question: "A right angle measures:",
          options: ["90°", "45°", "180°", "360°"],
          answer: "90°",
        },
        {
          question: "The sum of angles in a triangle is:",
          options: ["180°", "90°", "270°", "360°"],
          answer: "180°",
        },
        {
          question: "A circle has how many straight sides?",
          options: ["0", "1", "2", "4"],
          answer: "0",
        },
      ],
    },

    Trigonometry: {
      explanation:
        "Trigonometry studies relationships between angles and sides of triangles.",
      example:
        "In a right triangle, sine relates the opposite side to the hypotenuse.",
      keyPoints: [
        "Trigonometry studies triangles.",
        "Sine, cosine and tangent are common ratios.",
        "Right triangles are frequently used.",
        "Angles are important in trigonometric calculations.",
      ],
      questions: [
        {
          question: "Which ratio is opposite divided by hypotenuse?",
          options: ["Sine", "Cosine", "Tangent", "Secant"],
          answer: "Sine",
        },
        {
          question: "Which ratio is adjacent divided by hypotenuse?",
          options: ["Cosine", "Sine", "Tangent", "Cotangent"],
          answer: "Cosine",
        },
        {
          question: "Which ratio is opposite divided by adjacent?",
          options: ["Tangent", "Sine", "Cosine", "Secant"],
          answer: "Tangent",
        },
        {
          question: "Trigonometry commonly studies relationships in:",
          options: ["Triangles", "Circles only", "Squares only", "Cubes only"],
          answer: "Triangles",
        },
        {
          question: "A right angle measures:",
          options: ["90°", "30°", "60°", "180°"],
          answer: "90°",
        },
      ],
    },

    Probability: {
      explanation:
        "Probability measures how likely an event is to occur. Its value ranges from 0 to 1.",
      example:
        "For a fair coin, the probability of getting heads is 1/2.",
      keyPoints: [
        "Probability measures likelihood.",
        "Probability ranges from 0 to 1.",
        "An impossible event has probability 0.",
        "A certain event has probability 1.",
      ],
      questions: [
        {
          question: "What is the probability of a certain event?",
          options: ["1", "0", "0.5", "2"],
          answer: "1",
        },
        {
          question: "What is the probability of an impossible event?",
          options: ["0", "1", "0.5", "2"],
          answer: "0",
        },
        {
          question: "Probability of heads for a fair coin is:",
          options: ["1/2", "1", "0", "2"],
          answer: "1/2",
        },
        {
          question: "Probability values normally lie between:",
          options: ["0 and 1", "1 and 10", "-10 and 10", "10 and 100"],
          answer: "0 and 1",
        },
        {
          question: "A fair six-sided die has how many possible outcomes?",
          options: ["6", "4", "8", "10"],
          answer: "6",
        },
      ],
    },

    Statistics: {
      explanation:
        "Statistics involves collecting, organizing, analyzing and interpreting data.",
      example:
        "The average marks of students in a class can be calculated using the mean.",
      keyPoints: [
        "Statistics deals with data.",
        "Mean is a measure of central tendency.",
        "Median is the middle value of ordered data.",
        "Mode is the most frequent value.",
      ],
      questions: [
        {
          question: "What is the mean of 2, 4 and 6?",
          options: ["4", "3", "6", "12"],
          answer: "4",
        },
        {
          question: "Which value occurs most frequently?",
          options: ["Mode", "Mean", "Median", "Range"],
          answer: "Mode",
        },
        {
          question: "The middle value of ordered data is the:",
          options: ["Median", "Mean", "Mode", "Range"],
          answer: "Median",
        },
        {
          question: "Statistics mainly deals with:",
          options: ["Data", "Only shapes", "Only equations", "Only networks"],
          answer: "Data",
        },
        {
          question: "The difference between maximum and minimum is:",
          options: ["Range", "Mean", "Mode", "Median"],
          answer: "Range",
        },
      ],
    },

    Mensuration: {
      explanation:
        "Mensuration deals with measuring geometric quantities such as length, area, surface area and volume.",
      example:
        "The area of a rectangle is calculated by multiplying its length and breadth.",
      keyPoints: [
        "Mensuration involves measurement of geometric quantities.",
        "Area measures a surface.",
        "Volume measures space occupied.",
        "Different shapes have different formulas.",
      ],
      questions: [
        {
          question: "Area of a rectangle is:",
          options: [
            "Length × Breadth",
            "Length + Breadth",
            "2 × Length",
            "Breadth ÷ Length",
          ],
          answer: "Length × Breadth",
        },
        {
          question: "Volume measures:",
          options: [
            "Space occupied",
            "Only length",
            "Only angle",
            "Only perimeter",
          ],
          answer: "Space occupied",
        },
        {
          question: "Perimeter measures:",
          options: [
            "Distance around a shape",
            "Space inside a shape",
            "Weight",
            "Volume",
          ],
          answer: "Distance around a shape",
        },
        {
          question: "Area is measured in:",
          options: ["Square units", "Cubic units", "Units only", "Degrees"],
          answer: "Square units",
        },
        {
          question: "Volume is measured in:",
          options: ["Cubic units", "Square units", "Degrees", "Percent"],
          answer: "Cubic units",
        },
      ],
    },

    "Basic Calculus": {
      explanation:
        "Calculus studies change and accumulation. Differentiation and integration are its two major operations.",
      example:
        "The derivative of x² is 2x, which represents its rate of change.",
      keyPoints: [
        "Calculus studies change and accumulation.",
        "Differentiation finds rates of change.",
        "Integration can represent accumulation.",
        "Functions are central to calculus.",
      ],
      questions: [
        {
          question: "What does differentiation commonly measure?",
          options: [
            "Rate of change",
            "Only total mass",
            "Only area",
            "Only temperature",
          ],
          answer: "Rate of change",
        },
        {
          question: "The derivative of x² is:",
          options: ["2x", "x", "x³", "2"],
          answer: "2x",
        },
        {
          question: "Which is a major operation in calculus?",
          options: ["Integration", "Sorting", "Routing", "Compilation"],
          answer: "Integration",
        },
        {
          question: "Calculus is mainly concerned with:",
          options: [
            "Change and accumulation",
            "Only geometry",
            "Only counting",
            "Only programming",
          ],
          answer: "Change and accumulation",
        },
        {
          question: "The derivative of a constant is:",
          options: ["0", "1", "The constant itself", "Undefined always"],
          answer: "0",
        },
      ],
    },
  };

  // --------------------------------------------------
  // GET CURRENT TOPIC DATA
  // --------------------------------------------------

  const currentTopicData = topicData[selectedTopic] || {
    explanation: `This topic is available in RuralEdu. Learning material for ${selectedTopic} can be added here.`,
    example: `You can use the AI Assistant below to ask questions about ${selectedTopic}.`,
    keyPoints: [
      `${selectedTopic} is part of the selected subject.`,
      "More learning material can be added.",
      "The AI Assistant can answer questions about this topic.",
      "A topic-specific quiz is available.",
    ],
    questions: [
      {
        question: `What topic are you currently learning?`,
        options: [
          selectedTopic,
          "Unrelated Topic",
          "Another Subject",
          "None of these",
        ],
        answer: selectedTopic,
      },
    ],
  };

  const quizQuestions = currentTopicData.questions;

  // --------------------------------------------------
  // AI ASSISTANT
  // --------------------------------------------------

  const askAI = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
          topic: selectedTopic,
        }),
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAnswer("Unable to connect to the AI assistant.");
    }

    setLoading(false);
  };

 // --------------------------------------------------
// QUIZ SUBMISSION
// --------------------------------------------------

const submitQuiz = async () => {
  const loggedInUser = JSON.parse(
  localStorage.getItem("ruralEduUser") || "null"
);

const currentSubject = selectedSubject?.name;
const currentTopic = selectedTopic;
  if (quizSubmitted || quizQuestions.length === 0) return;

  let score = 0;

  quizQuestions.forEach((quiz, index) => {
    if (selectedAnswers[index] === quiz.answer) {
      score++;
    }
  });

  const percentage = Math.round(
    (score / quizQuestions.length) * 100
  );

  const newMark = {
    id: Date.now(),
    student: username || "Student",
    subject: selectedSubject?.name || "Unknown",
    topic: selectedTopic || "Unknown",
    score,
    total: quizQuestions.length,
    percentage,
    date: new Date().toLocaleString(),
    synced: false,
  };

  // Preserve the existing local history
  const updatedMarks = [...marks, newMark];

  setMarks(updatedMarks);
  localStorage.setItem(
    "ruralEduMarks",
    JSON.stringify(updatedMarks)
  );

  setQuizScore(score);
  setQuizSubmitted(true);

  // Save the result to MySQL through Flask
  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/quiz/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  user_id: loggedInUser?.id,
  subject_name: currentSubject,
  topic_name: currentTopic,
  score,
  total_questions: quizQuestions.length,
}),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save quiz result");
    }

    // Mark this result as saved in the database
    const syncedMarks = updatedMarks.map((mark) =>
      mark.id === newMark.id
        ? { ...mark, synced: true, databaseId: data.attempt_id }
        : mark
    );

    setMarks(syncedMarks);
    localStorage.setItem(
      "ruralEduMarks",
      JSON.stringify(syncedMarks)
    );

    console.log("Quiz result saved to MySQL:", data);
  } catch (error) {
    console.error("Could not save quiz result to MySQL:", error);
  }
};

  // --------------------------------------------------
  // STUDENT PERFORMANCE / PERSONALIZATION
  // --------------------------------------------------

  const getTopicStats = () => {
    const topicMap = {};

    marks.forEach((mark) => {
      if (!topicMap[mark.topic]) {
        topicMap[mark.topic] = {
          topic: mark.topic,
          subject: mark.subject,
          attempts: 0,
          totalPercentage: 0,
          latestPercentage: mark.percentage,
        };
      }

      topicMap[mark.topic].attempts += 1;
      topicMap[mark.topic].totalPercentage += mark.percentage;
      topicMap[mark.topic].latestPercentage = mark.percentage;
    });

    return Object.values(topicMap).map((item) => ({
      ...item,
      average: Math.round(item.totalPercentage / item.attempts),
    }));
  };

  const topicStats = getTopicStats();

  const totalQuizzes = marks.length;

  const averagePercentage =
    totalQuizzes > 0
      ? Math.round(
          marks.reduce((sum, mark) => sum + mark.percentage, 0) /
            totalQuizzes
        )
      : 0;

  const weakTopics = topicStats
    .filter((item) => item.average < 60)
    .sort((a, b) => a.average - b.average);

  const strongestTopics = [...topicStats]
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

  const recommendedTopic =
    weakTopics.length > 0 ? weakTopics[0] : null;

  const subjectStats = subjects.map((subject) => {
    const subjectMarks = marks.filter(
      (mark) => mark.subject === subject.name
    );

    const average =
      subjectMarks.length > 0
        ? Math.round(
            subjectMarks.reduce(
              (sum, mark) => sum + mark.percentage,
              0
            ) / subjectMarks.length
          )
        : 0;

    return {
      ...subject,
      attempts: subjectMarks.length,
      average,
    };
  });

  const clearMarks = () => {
    const confirmed = window.confirm(
      "Clear all saved student marks and performance history?"
    );

    if (confirmed) {
      setMarks([]);
      localStorage.removeItem("ruralEduMarks");
    }
  };
    // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-logo">
            RuralEdu
          </div>

          <h1>Welcome to RuralEdu</h1>

          <p className="login-subtitle">
            AI-Assisted Personalized Learning for Rural Education
          </p>

          <div className="login-form">
  {!showRegister ? (
  <>
      <label>Email / Username</label>
      <input
        type="text"
        value={loginUsername}
        onChange={(e) => setLoginUsername(e.target.value)}
        placeholder="Enter your email"
      />

      <label>Password</label>
      <input
        type="password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        placeholder="Enter your password"
      />

      {loginError && (
        <p className="login-error">{loginError}</p>
      )}
      <button
  type="button"
  onClick={() => {
    setShowRegister(true);
    setLoginError("");
    setRegisterMessage("");
  }}
>
  New student? Create an account
</button>

            <p className="role-title">
              Login as
            </p>

            <div className="role-buttons">

              <button
                className="role-button"
                onClick={() => handleLogin("Student")}
              >
                🎓
                <span>
                  <strong>Student</strong>
                  <small>Learn & practice</small>
                </span>
              </button>

              <button
                className="role-button"
                onClick={() => handleLogin("Teacher")}
              >
                👩‍🏫
                <span>
                  <strong>Teacher</strong>
                  <small>Manage learning</small>
                </span>
              </button>

              <button
                className="role-button"
                onClick={() => handleLogin("Admin")}
              >
                ⚙️
                <span>
                  <strong>Admin</strong>
                  <small>Manage platform</small>
                </span>
                            </button>

            </div>

          </>
        ) : (
          <>
  <h2>Create Student Account</h2>

  <label>Full Name</label>
  <input
    type="text"
    value={registerName}
    onChange={(e) => setRegisterName(e.target.value)}
    placeholder="Enter your full name"
  />

  <label>Email</label>
  <input
    type="email"
    value={registerEmail}
    onChange={(e) => setRegisterEmail(e.target.value)}
    placeholder="Enter your email"
  />

  <label>Password</label>
  <input
    type="password"
    value={registerPassword}
    onChange={(e) => setRegisterPassword(e.target.value)}
    placeholder="Create a password (minimum 8 characters)"
  />

  {registerMessage && (
    <p>{registerMessage}</p>
  )}

  <button
    type="button"
    onClick={handleRegister}
    disabled={isLoading}
  >
    {isLoading ? "Please wait..." : "Create Account"}
  </button>

  <button
    type="button"
    onClick={() => {
      setShowRegister(false);
      setRegisterMessage("");
      setLoginError("");
    }}
  >
    Back to Login
  </button>
</>
        )}

          </div>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // TEACHER DASHBOARD
  // --------------------------------------------------
  if (isLoggedIn && userRole === "Teacher") {
    const filteredStudents = teacherData.students.filter((student) => {
      const search = teacherSearch.toLowerCase();
      return student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search);
    });
    const avgScore = teacherData.attempts.length
      ? Math.round(teacherData.attempts.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / teacherData.attempts.length)
      : 0;
    const needsHelp = teacherData.students.filter((student) => student.average_percentage !== null && Number(student.average_percentage) < 60).length;

    return (
      <div className="app">
        <header className="navbar">
          <h2>RuralEdu · Teacher</h2>
          <div className="navbar-right">
            <span>👩‍🏫 {username}</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="container">
          <section className="welcome">
            <h1>Teacher Dashboard</h1>
            <p>Monitor student progress and identify topics that need additional support.</p>
            <button onClick={loadTeacherDashboard} disabled={teacherData.loading}>
              {teacherData.loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </section>
          {teacherData.error && <p className="login-error">{teacherData.error}</p>}
          <section className="teacher-materials-section">
            <div className="panel-title-row">
              <h2>📚 Manage Learning Materials</h2>
              <span>PDF notes for each subject and topic</span>
            </div>
            <form className="material-upload-form" onSubmit={uploadLearningMaterial}>
              <label>Subject
                <select value={materialSubject} onChange={(e) => {
                  const nextSubject = e.target.value;
                  setMaterialSubject(nextSubject);
                  const match = subjects.find((item) => item.name === nextSubject);
                  setMaterialTopic(match?.topics?.[0] || "");
                }}>
                  {subjects.map((subject) => <option key={subject.name} value={subject.name}>{subject.name}</option>)}
                </select>
              </label>
              <label>Topic
                <select value={materialTopic} onChange={(e) => setMaterialTopic(e.target.value)}>
                  {(subjects.find((item) => item.name === materialSubject)?.topics || []).map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </select>
              </label>
              <label>Material title
                <input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="e.g. Refraction Study Notes" maxLength={150} />
              </label>
              <label>PDF file
                <input id="ruraledu-pdf-file" type="file" accept="application/pdf,.pdf" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} />
              </label>
              <button type="submit" disabled={materialBusy}>{materialBusy ? "Uploading..." : "Upload PDF"}</button>
            </form>
            {materialMessage && <p className="material-message" role="status">{materialMessage}</p>}
            <div className="material-list">
              <h3>Uploaded Materials ({teacherMaterials.length})</h3>
              {teacherMaterials.length === 0 ? <p>No PDFs uploaded yet. Upload notes for a subject and topic above.</p> : teacherMaterials.map((material) => (
                <div className="material-row" key={material.id}>
                  <div className="material-info"><strong>📄 {material.title}</strong><span>{material.subject_name} · {material.topic_name}</span><small>{material.original_filename}</small></div>
                  <div className="material-actions"><a href={`http://127.0.0.1:5000/api/materials/${material.id}/file`} target="_blank" rel="noreferrer">View PDF</a><button type="button" className="material-delete-button" onClick={() => deleteLearningMaterial(material.id)}>Delete</button></div>
                </div>
              ))}
            </div>
          </section>
          <section className="performance-dashboard">
            <div className="performance-summary">
              <div className="performance-stat"><span className="performance-icon">🎓</span><div><h3>{teacherData.students.length}</h3><p>Registered Students</p></div></div>
              <div className="performance-stat"><span className="performance-icon">📝</span><div><h3>{teacherData.attempts.length}</h3><p>Quiz Attempts</p></div></div>
              <div className="performance-stat"><span className="performance-icon">🎯</span><div><h3>{avgScore}%</h3><p>Overall Average</p></div></div>
              <div className="performance-stat"><span className="performance-icon">⚠️</span><div><h3>{needsHelp}</h3><p>Students Below 60%</p></div></div>
            </div>
            <div className="marks-history">
              <div className="panel-title-row"><h3>👥 Student Performance</h3><input value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} placeholder="Search name or email" /></div>
              {teacherData.loading && <p>Loading student records...</p>}
              {!teacherData.loading && filteredStudents.length === 0 && <p>No student records found.</p>}
              {filteredStudents.length > 0 && <div className="marks-table-wrapper"><table className="marks-table">
                <thead><tr><th>Student</th><th>Email</th><th>Attempts</th><th>Average</th><th>Performance</th></tr></thead>
                <tbody>{filteredStudents.map((student) => <tr key={student.id}>
                  <td>{student.name}</td><td>{student.email}</td><td>{student.attempt_count}</td>
                  <td>{student.average_percentage === null ? "—" : `${Number(student.average_percentage).toFixed(1)}%`}</td>
                  <td><span className={Number(student.average_percentage) < 60 && student.average_percentage !== null ? "status-badge needs-practice" : "status-badge good"}>{student.average_percentage === null ? "Not attempted" : Number(student.average_percentage) < 60 ? "Needs Support" : "On Track"}</span></td>
                </tr>)}</tbody>
              </table></div>}
            </div>
            <div className="marks-history">
              <div className="panel-title-row"><h3>📋 Recent Quiz Attempts</h3><span>{teacherData.attempts.length} records</span></div>
              {teacherData.attempts.length === 0 ? <p>No quiz attempts have been recorded yet.</p> :
                <div className="marks-table-wrapper"><table className="marks-table">
                  <thead><tr><th>Student</th><th>Subject</th><th>Topic</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead>
                  <tbody>{teacherData.attempts.map((attempt) => <tr key={attempt.attempt_id}>
                    <td>{attempt.student_name}</td><td>{attempt.subject}</td><td>{attempt.topic}</td>
                    <td>{attempt.score} / {attempt.total_questions}</td><td>{Number(attempt.percentage).toFixed(1)}%</td>
                    <td>{attempt.attempted_at ? new Date(attempt.attempted_at).toLocaleString() : "—"}</td>
                  </tr>)}</tbody>
                </table></div>}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // LEARNING PAGE
  // --------------------------------------------------

  if (selectedTopic) {
    const content = currentTopicData;

    return (
      <div className="app">
        <header className="navbar">
  <h2>RuralEdu</h2>

  <div className="navbar-right">
    <span>👤 {username || userRole}</span>

    <button
      className="logout-button"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
</header>

        <main className="container">
          <button
            className="back-button"
            onClick={() => {
              setSelectedTopic(null);
              setShowAI(false);
              setShowQuiz(false);
              setQuestion("");
              setAnswer("");
              setSelectedAnswers({});
              setQuizScore(null);
              setQuizSubmitted(false);
            }}
          >
            ← Back to Topics
          </button>

          <section className="learning-page">
            <h1>{selectedTopic}</h1>

            {/* LEARNING CONTENT */}

            <div className="learning-card">
              <h2>📖 Simple Explanation</h2>
              <p>{content.explanation}</p>
            </div>

            <div className="learning-card">
              <h2>💡 Real-Life Example</h2>
              <p>{content.example}</p>
            </div>

            <div className="learning-card">
              <h2>🔑 Key Points</h2>

              <ul>
                {content.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            {/* TEACHER-UPLOADED PDF NOTES */}
            <div className="topic-materials-card">
              <h2>📚 Teacher's Study Materials</h2>
              {topicMaterialsLoading ? <p>Checking for study notes...</p> : topicMaterials.length === 0 ? <p>No teacher-uploaded PDF notes are available for this topic yet.</p> : (
                <div className="student-material-list">
                  {topicMaterials.map((material) => <div className="student-material-row" key={material.id}>
                    <div><strong>📄 {material.title}</strong><span>{material.original_filename}</span></div>
                    <a href={`http://127.0.0.1:5000/api/materials/${material.id}/file`} target="_blank" rel="noreferrer">Open PDF</a>
                  </div>)}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}

            <div className="learning-actions">
              <button
                onClick={() => {
                  setShowAI(!showAI);
                  setAnswer("");
                }}
              >
                🤖 Ask AI
              </button>

              <button
                onClick={() => {
                  setShowQuiz(true);
                  setQuizScore(null);
                  setSelectedAnswers({});
                  setQuizSubmitted(false);
                }}
              >
                📝 Take Quiz
              </button>
            </div>

            {/* AI ASSISTANT */}

            {showAI && (
              <div className="ai-box">
                <h2>🤖 RuralEdu AI Assistant</h2>

                <p>
                  Ask anything about <strong>{selectedTopic}</strong>.
                </p>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`Ask a question about ${selectedTopic}...`}
                  rows="4"
                />

                <button onClick={askAI} disabled={loading}>
                  {loading ? "Thinking..." : "Ask AI"}
                </button>

                {answer && (
                  <div className="ai-answer">
                    <h3>AI Answer</h3>
                    <p>{answer}</p>
                  </div>
                )}
              </div>
            )}

            {/* QUIZ */}

            {showQuiz && (
              <div className="quiz-box">
                <h2>📝 {selectedTopic} Quiz</h2>

                {quizQuestions.map((quiz, index) => (
                  <div className="quiz-question" key={index}>
                    <h3>
                      {index + 1}. {quiz.question}
                    </h3>

                    {quiz.options.map((option) => (
                      <label key={option} className="quiz-option">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={selectedAnswers[index] === option}
                          onChange={() =>
                            setSelectedAnswers({
                              ...selectedAnswers,
                              [index]: option,
                            })
                          }
                        />

                        {option}
                      </label>
                    ))}
                  </div>
                ))}

                <button onClick={submitQuiz} disabled={quizSubmitted}>
                  {quizSubmitted ? "Quiz Submitted" : "Submit Quiz"}
                </button>

                {/* RESULT */}

                {quizScore !== null && (
                  <div className="quiz-result">
                    <h2>🎯 Your Result</h2>

                    <p>
                      Score: {quizScore} / {quizQuestions.length}
                    </p>

                    <p>
                      Percentage:{" "}
                      {(
                        (quizScore / quizQuestions.length) *
                        100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                )}

                {/* ANSWER REVIEW */}

                {quizSubmitted && (
                  <div className="quiz-review">
                    <h2>📋 Answer Review</h2>

                    {quizQuestions.map((quiz, index) => {
                      const userAnswer = selectedAnswers[index];
                      const isCorrect = userAnswer === quiz.answer;

                      return (
                        <div
                          className={`review-question ${
                            isCorrect ? "correct" : "wrong"
                          }`}
                          key={index}
                        >
                          <h3>
                            {index + 1}. {quiz.question}
                          </h3>

                          <p>
                            Your answer:{" "}
                            <strong>
                              {userAnswer || "Not answered"}
                            </strong>{" "}
                            {isCorrect ? "✅" : "❌"}
                          </p>

                          {!isCorrect && (
                            <p>
                              Correct answer:{" "}
                              <strong>{quiz.answer}</strong>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // TOPIC PAGE
  // --------------------------------------------------

  if (selectedSubject) {
    return (
      <div className="app">
        <header className="navbar">
  <h2>RuralEdu</h2>

  <div className="navbar-right">
    <span>👤 {username || userRole}</span>

    <button
      className="logout-button"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
</header>

        <main className="container">
          <section className="topics-section">
            <button
              className="back-button"
              onClick={() => setSelectedSubject(null)}
            >
              ← Back to Subjects
            </button>

            <h2>
              {selectedSubject.icon} {selectedSubject.name}
            </h2>

            <p>Select a topic to start learning.</p>

            <div className="topics">
              {selectedSubject.topics.map((topic) => (
                <div className="topic-card" key={topic}>
                  <h3>{topic}</h3>

                  <button
                    onClick={() => {
                      setSelectedTopic(topic);
                      setShowAI(false);
                      setShowQuiz(false);
                      setQuestion("");
                      setAnswer("");
                      setSelectedAnswers({});
                      setQuizScore(null);
                      setQuizSubmitted(false);
                    }}
                  >
                    Start Learning
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // HOME PAGE
  // --------------------------------------------------

  return (
    <div className="app">
      <header className="navbar">
  <h2>RuralEdu</h2>

  <div className="navbar-right">
    <span>👤 {username || userRole}</span>

    <button
      className="logout-button"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
</header>

      <main className="container">
        <section className="welcome">
          <h1>Welcome to RuralEdu 👋</h1>

          <p>
            Learn at your own pace with personalized academic support.
          </p>
        </section>

        {/* --------------------------------------------------
             STUDENT PERFORMANCE DASHBOARD
        -------------------------------------------------- */}

        <section className="performance-dashboard">

          <div className="section-heading-row">
            <div>
              <h2>📊 My Learning Performance</h2>
              <p>Track your quiz results and identify topics that need more practice.</p>
            </div>

            {marks.length > 0 && (
              <button className="clear-marks-button" onClick={clearMarks}>
                Clear History
              </button>
            )}
          </div>

          <div className="performance-summary">

            <div className="performance-stat">
              <span className="performance-icon">📝</span>
              <div>
                <h3>{totalQuizzes}</h3>
                <p>Quizzes Attempted</p>
              </div>
            </div>

            <div className="performance-stat">
              <span className="performance-icon">🎯</span>
              <div>
                <h3>{averagePercentage}%</h3>
                <p>Average Score</p>
              </div>
            </div>

            <div className="performance-stat">
              <span className="performance-icon">⚠️</span>
              <div>
                <h3>{weakTopics.length}</h3>
                <p>Topics to Improve</p>
              </div>
            </div>

            <div className="performance-stat">
              <span className="performance-icon">🏆</span>
              <div>
                <h3>{strongestTopics.length}</h3>
                <p>Strong Topics</p>
              </div>
            </div>

          </div>

          {recommendedTopic ? (
            <div className="recommendation-card">

              <div>
                <span className="recommendation-label">
                  🤖 Personalized Recommendation
                </span>

                <h3>Focus on {recommendedTopic.topic}</h3>

                <p>
                  Your average score for this topic is{" "}
                  <strong>{recommendedTopic.average}%</strong>.
                  Review the learning material and try the quiz again
                  to strengthen this topic.
                </p>
              </div>

              <button
                onClick={() => {
                  const subject = subjects.find(
                    (item) => item.name === recommendedTopic.subject
                  );

                  if (subject) {
                    setSelectedSubject(subject);
                    setSelectedTopic(recommendedTopic.topic);
                    setShowAI(false);
                    setShowQuiz(false);
                    setQuestion("");
                    setAnswer("");
                    setSelectedAnswers({});
                    setQuizScore(null);
                    setQuizSubmitted(false);
                  }
                }}
              >
                Review Topic →
              </button>

            </div>
          ) : marks.length > 0 ? (
            <div className="recommendation-card positive">
              <div>
                <span className="recommendation-label">
                  🌟 Keep Going
                </span>
                <h3>No major weak topic detected</h3>
                <p>
                  Your current quiz performance is 60% or above across
                  the topics you have attempted. Continue practicing to
                  improve your scores.
                </p>
              </div>
            </div>
          ) : (
            <div className="recommendation-card empty">
              <div>
                <span className="recommendation-label">
                  🤖 Personalized Learning
                </span>
                <h3>Take your first quiz</h3>
                <p>
                  Complete a topic quiz and RuralEdu will use your marks
                  to identify topics that need more practice.
                </p>
              </div>
            </div>
          )}

          {marks.length > 0 && (
            <div className="performance-details">

              <div className="performance-panel">
                <div className="panel-title-row">
                  <h3>📈 Subject Progress</h3>
                </div>

                {subjectStats.map((subject) => (
                  <div className="subject-progress" key={subject.name}>

                    <div className="progress-label">
                      <span>
                        {subject.icon} {subject.name}
                      </span>

                      <span>
                        {subject.attempts > 0
                          ? `${subject.average}%`
                          : "Not attempted"}
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${subject.average}%` }}
                      />
                    </div>

                  </div>
                ))}
              </div>

              <div className="performance-panel">
                <div className="panel-title-row">
                  <h3>📚 Topic Performance</h3>
                </div>

                {topicStats.length === 0 ? (
                  <p>No topic performance available yet.</p>
                ) : (
                  <div className="topic-performance-list">

                    {topicStats
                      .sort((a, b) => a.average - b.average)
                      .map((item) => (
                        <div
                          className="topic-performance-row"
                          key={item.topic}
                        >
                          <div>
                            <strong>{item.topic}</strong>
                            <small>
                              {item.subject} · {item.attempts} attempt
                              {item.attempts !== 1 ? "s" : ""}
                            </small>
                          </div>

                          <span
                            className={
                              item.average < 60
                                ? "score-badge weak"
                                : item.average >= 80
                                ? "score-badge strong"
                                : "score-badge average"
                            }
                          >
                            {item.average}%
                          </span>
                        </div>
                      ))}

                  </div>
                )}
              </div>

            </div>
          )}

          {marks.length > 0 && (
            <div className="marks-history">

              <div className="panel-title-row">
                <h3>📋 Marks History</h3>
                <span>{marks.length} total attempt{marks.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="marks-table-wrapper">
                <table className="marks-table">

                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Topic</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...marks].reverse().map((mark) => (
                      <tr key={mark.id || `${mark.topic}-${mark.date}`}>

                        <td>{mark.subject}</td>

                        <td>{mark.topic}</td>

                        <td>
                          {mark.score} / {mark.total}
                        </td>

                        <td>
                          <strong>{mark.percentage}%</strong>
                        </td>

                        <td>
                          <span
                            className={
                              mark.percentage < 60
                                ? "status-badge needs-practice"
                                : mark.percentage >= 80
                                ? "status-badge good"
                                : "status-badge improving"
                            }
                          >
                            {mark.percentage < 60
                              ? "Needs Practice"
                              : mark.percentage >= 80
                              ? "Good"
                              : "Improving"}
                          </span>
                        </td>

                        <td>{mark.date}</td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

            </div>
          )}

        </section>

        <section>
          <h2>Choose a Subject</h2>

          <div className="subjects">
            {subjects.map((subject) => (
              <div className="subject-card" key={subject.name}>
                <h3>
                  {subject.icon} {subject.name}
                </h3>

                <p>{subject.description}</p>

                <button onClick={() => setSelectedSubject(subject)}>
                  Explore
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;