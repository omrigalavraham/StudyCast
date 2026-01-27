import { useState, useEffect, useMemo } from 'react';
import { get, set, del } from 'idb-keyval';
import { AppState, FileData, SummaryData, Course, Lecture, ViewState, ProcessingMode, ScriptLine, ChatMessage, Insight } from '../types';
import { analyzePresentation, generatePodcastAudio, chatWithLecture, generateQuiz } from '../services/geminiService';

export const useAppStore = () => {
    // --- Global State ---
    const [courses, setCourses] = useState<Course[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Auth State
    const [user, setUser] = useState<{ apiKey: string; name: string } | null>(null);

    const [viewState, setViewState] = useState<ViewState>({ type: 'DASHBOARD' });
    const [isDarkMode, setIsDarkMode] = useState(false);

    // --- Persistence Logic ---
    useEffect(() => {
        const loadData = async () => {
            const savedTheme = localStorage.getItem('studycast_theme');
            if (savedTheme === 'dark') setIsDarkMode(true);

            try {
                // Load User
                const savedUser = await get('studycast_user');
                if (savedUser) {
                    setUser(savedUser);
                }

                // Load Courses
                const savedCourses = await get('studycast_courses');
                if (savedCourses) {
                    setCourses(savedCourses);
                } else {
                    setCourses([
                        {
                            id: 'c1',
                            name: 'מבוא לפסיכולוגיה חברתית',
                            code: 'PSY-101',
                            color: 'bg-indigo-500',
                            lectures: []
                        },
                        {
                            id: 'c2',
                            name: 'היסטוריה של המזרח התיכון',
                            code: 'HIS-204',
                            color: 'bg-emerald-500',
                            lectures: []
                        }
                    ]);
                }
            } catch (err) {
                console.error("Failed to load data from DB:", err);
            } finally {
                setIsDataLoaded(true);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        localStorage.setItem('studycast_theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        if (isDataLoaded) {
            set('studycast_courses', courses).catch(err => console.error("Failed to save data to DB:", err));
        }
    }, [courses, isDataLoaded]);

    // Save user on change
    useEffect(() => {
        if (isDataLoaded && user) {
            set('studycast_user', user);
        }
    }, [user, isDataLoaded]);

    const activeCourse = useMemo(() => {
        if (viewState.type === 'DASHBOARD') return null;
        return courses.find(c => c.id === viewState.courseId) || null;
    }, [courses, viewState]);

    const activeLecture = useMemo(() => {
        if (viewState.type !== 'LECTURE' || !activeCourse) return null;
        return activeCourse.lectures.find(l => l.id === viewState.lectureId) || null;
    }, [activeCourse, viewState]);

    // --- Actions ---
    const handleLogin = (apiKey: string, name: string) => {
        setUser({ apiKey, name });
    };

    const handleLogout = async () => {
        setUser(null);
        await del('studycast_user');
        setViewState({ type: 'DASHBOARD' });
    };

    const addCourse = (name: string) => {
        const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newCourse: Course = {
            id: crypto.randomUUID(),
            name: name,
            code: name.substring(0, 3).toUpperCase() + '-101',
            color: randomColor,
            lectures: []
        };
        setCourses([...courses, newCourse]);
    };

    const updateCourse = (id: string, name: string) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, name: name } : c));
    };

    const addLecture = (courseId: string, name: string) => {
        const newLecture: Lecture = {
            id: crypto.randomUUID(),
            title: name,
            date: new Date().toLocaleDateString('he-IL'),
            status: 'EMPTY'
        };
        setCourses(prev => prev.map(c => {
            if (c.id === courseId) {
                return { ...c, lectures: [newLecture, ...c.lectures] };
            }
            return c;
        }));
    };

    const updateLecture = (courseId: string, lectureId: string, updates: Partial<Lecture>) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return { ...l, ...updates };
                })
            };
        }));
    };

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const processLecture = async (courseId: string, lectureId: string, file: FileData, mode: ProcessingMode) => {
        if (!user) return;

        updateLecture(courseId, lectureId, {
            fileData: file,
            status: 'ANALYZING',
            processingMode: mode,
            errorMsg: undefined
        });

        try {
            const result = await analyzePresentation(user.apiKey, file.base64, file.mimeType, mode);
            updateLecture(courseId, lectureId, {
                summaryData: result,
                status: 'READY'
            });
        } catch (err) {
            console.error(err);
            updateLecture(courseId, lectureId, {
                status: 'ERROR',
                errorMsg: "נכשל בניתוח המצגת. אנא נסה שוב."
            });
        }
    };

    const generateAudio = async (courseId: string, lectureId: string, script: ScriptLine[]) => {
        if (!user) return;

        // Validate course and lecture exist before proceeding
        const currentCourse = courses.find(c => c.id === courseId);
        if (!currentCourse) {
            console.error(`generateAudio: Course not found: ${courseId}`);
            return;
        }
        const currentLecture = currentCourse.lectures.find(l => l.id === lectureId);
        if (!currentLecture) {
            console.error(`generateAudio: Lecture not found: ${lectureId}`);
            return;
        }

        try {
            const { audioBase64, uniqueScript } = await generatePodcastAudio(user.apiKey, script);

            // We need to update the script in summaryData with the new one containing timestamps
            const currentSummaryData = currentLecture.summaryData;

            updateLecture(courseId, lectureId, {
                audioBase64: audioBase64,
                audioGeneratedDate: new Date().toLocaleString('he-IL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                // Update the script with timestamps
                summaryData: currentSummaryData ? {
                    ...currentSummaryData,
                    script: uniqueScript
                } : undefined
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    // --- Chat & Insights Actions ---

    const sendChatMessage = async (courseId: string, lectureId: string, message: string) => {
        if (!user || !activeLecture || !activeLecture.summaryData) return;

        // 1. Add User Message
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        const currentHistory = activeLecture.chatHistory || [];
        updateLecture(courseId, lectureId, {
            chatHistory: [...currentHistory, userMsg]
        });

        // 2. Get AI Response
        const context = {
            summary: activeLecture.summaryData.summary,
            summaryPoints: activeLecture.summaryData.summaryPoints
        };

        try {
            const aiResponseText = await chatWithLecture(
                user.apiKey,
                context,
                currentHistory,
                message
            );

            const aiMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'ai',
                content: aiResponseText,
                timestamp: new Date().toISOString()
            };

            setCourses(prev => prev.map(c => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    lectures: c.lectures.map(l => {
                        if (l.id !== lectureId) return l;
                        // FIX: Do NOT re-add userMsg. The previous state (l.chatHistory) already has it.
                        // We safely append aiMsg to the latest history.
                        return {
                            ...l,
                            chatHistory: [...(l.chatHistory || []), aiMsg]
                        };
                    })
                };
            }));

        } catch (err) {
            console.error(err);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'ai',
                content: "אופס, נתקלתי בשגיאה בתקשורת. אנא נסה שוב.",
                timestamp: new Date().toISOString()
            };

            setCourses(prev => prev.map(c => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    lectures: c.lectures.map(l => {
                        if (l.id !== lectureId) return l;
                        return {
                            ...l,
                            chatHistory: [...(l.chatHistory || []), errorMsg]
                        };
                    })
                };
            }));
        }
    };

    const addInsight = (courseId: string, lectureId: string, content: string) => {
        const newInsight: Insight = {
            id: crypto.randomUUID(),
            content,
            date: new Date().toLocaleDateString('he-IL')
        };

        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return { ...l, insights: [newInsight, ...(l.insights || [])] };
                })
            };
        }));
    };

    const deleteInsight = (courseId: string, lectureId: string, insightId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return {
                        ...l,
                        insights: (l.insights || []).filter(i => i.id !== insightId)
                    };
                })
            };
        }));
    };

    const deleteCourse = (courseId: string) => {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        if (viewState.type !== 'DASHBOARD' && viewState.courseId === courseId) {
            setViewState({ type: 'DASHBOARD' });
        }
    };

    const deleteLecture = (courseId: string, lectureId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.filter(l => l.id !== lectureId)
            };
        }));
        if (viewState.type === 'LECTURE' && viewState.lectureId === lectureId) {
            setViewState({ type: 'COURSE', courseId });
        }
    };

    const clearChatHistory = (courseId: string, lectureId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return { ...l, chatHistory: [] };
                })
            };
        }));
    };

    const initQuiz = (courseId: string, lectureId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    if (l.quiz) return l; // Already exists
                    return {
                        ...l,
                        quiz: {
                            status: 'SETUP',
                            settings: { difficulty: 'MEDIUM', questionCount: 5 },
                            questions: [],
                            userAnswers: {},
                            score: 0
                        }
                    };
                })
            };
        }));
        // We might want to switch tabs here, but that's UI logic usually.
    };

    const generateNewQuiz = async (courseId: string, lectureId: string, settings: any) => {
        if (!user || !activeLecture || !activeLecture.summaryData) return;

        // Set Loading
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return {
                        ...l,
                        quiz: {
                            ...(l.quiz!),
                            status: 'LOADING',
                            settings
                        }
                    };
                })
            };
        }));

        const context = {
            summary: activeLecture.summaryData.summary,
            summaryPoints: activeLecture.summaryData.summaryPoints
        };

        try {
            const questions = await generateQuiz(user.apiKey, context, settings);

            setCourses(prev => prev.map(c => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    lectures: c.lectures.map(l => {
                        if (l.id !== lectureId) return l;
                        return {
                            ...l,
                            quiz: {
                                status: 'ACTIVE',
                                settings,
                                questions,
                                userAnswers: {},
                                score: 0
                            }
                        };
                    })
                };
            }));

        } catch (error) {
            console.error(error);
            // Revert to SETUP on error?
            setCourses(prev => prev.map(c => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    lectures: c.lectures.map(l => {
                        if (l.id !== lectureId) return l;
                        return {
                            ...l,
                            quiz: {
                                ...(l.quiz!),
                                status: 'SETUP'
                            }
                        };
                    })
                };
            }));
            alert("שגיאה ביצירת הבוחן. נסה שוב.");
        }
    };

    const answerQuizQuestion = (courseId: string, lectureId: string, questionId: string, answerIdx: number) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    if (!l.quiz) return l;

                    const newAnswers = { ...l.quiz.userAnswers, [questionId]: answerIdx };

                    // Check if complete
                    const isComplete = l.quiz.questions.every(q => newAnswers[q.id] !== undefined);

                    let status = l.quiz.status;
                    let score = l.quiz.score;

                    if (isComplete) {
                        status = 'COMPLETED';
                        // Calc score
                        let correctCount = 0;
                        l.quiz.questions.forEach(q => {
                            if (newAnswers[q.id] === q.correctOptionIndex) correctCount++;
                        });
                        score = Math.round((correctCount / l.quiz.questions.length) * 100);
                    }

                    return {
                        ...l,
                        quiz: {
                            ...l.quiz,
                            userAnswers: newAnswers,
                            status: status as any,
                            score
                        }
                    };
                })
            };
        }));
    };

    const resetQuiz = (courseId: string, lectureId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    if (!l.quiz) return l;
                    return {
                        ...l,
                        quiz: {
                            ...l.quiz,
                            status: 'ACTIVE',
                            userAnswers: {},
                            score: 0
                        }
                    };
                })
            };
        }));
    };

    const closeQuiz = (courseId: string, lectureId: string) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            return {
                ...c,
                lectures: c.lectures.map(l => {
                    if (l.id !== lectureId) return l;
                    return {
                        ...l,
                        quiz: undefined
                    };
                })
            };
        }));
    };

    return {
        // State
        courses,
        isDataLoaded,
        user,
        viewState,
        isDarkMode,
        activeCourse,
        activeLecture,
        // Actions
        handleLogin,
        handleLogout,
        setViewState,
        addCourse,
        updateCourse,
        deleteCourse,
        addLecture,
        updateLecture,
        deleteLecture,
        toggleDarkMode,
        processLecture,
        generateAudio,
        sendChatMessage,
        clearChatHistory,
        addInsight,
        deleteInsight,
        // Quiz Actions
        initQuiz,
        generateNewQuiz,
        answerQuizQuestion,
        resetQuiz,
        closeQuiz
    };
};
