import React, { useState, useRef, useCallback } from 'react';
import { SummaryData, Highlight } from '../types';
import { HighlightText } from '../utils/highlight';
import { FloatingHighlightButton } from './FloatingHighlightButton';

interface DetailedSummaryProps {
    summaryData: SummaryData;
    highlightTerm?: string;
    highlights?: Highlight[];
    onAddHighlight?: (text: string, startOffset: number, endOffset: number) => void;
    onDeleteHighlight?: (highlightId: string) => void;
}

interface SelectionState {
    text: string;
    startOffset: number;
    endOffset: number;
    position: { x: number; y: number };
}

// פונקציה לרינדור טקסט עם הדגשות משתמש (צהוב) וחיפוש
const renderTextWithUserHighlights = (
    text: string,
    highlights: Highlight[],
    searchTerm?: string,
    onDeleteHighlight?: (id: string) => void
): React.ReactNode => {
    if (!highlights || highlights.length === 0) {
        return renderTextWithBold(text, searchTerm);
    }

    // מיון לפי מיקום
    const sorted = [...highlights]
        .filter(h => h.startOffset >= 0 && h.endOffset <= text.length)
        .sort((a, b) => a.startOffset - b.startOffset);

    if (sorted.length === 0) {
        return renderTextWithBold(text, searchTerm);
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((h) => {
        // טקסט רגיל לפני ההדגשה
        if (h.startOffset > lastIndex) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {renderTextWithBold(text.slice(lastIndex, h.startOffset), searchTerm)}
                </span>
            );
        }

        // טקסט מודגש
        parts.push(
            <span
                key={h.id}
                className="group/highlight relative inline bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-b-2 border-amber-400 px-0.5 rounded"
            >
                {renderTextWithBold(text.slice(h.startOffset, h.endOffset), searchTerm)}
                {onDeleteHighlight && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHighlight(h.id);
                        }}
                        className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover/highlight:opacity-100 transition-opacity flex items-center justify-center shadow-md"
                        title="מחק סימון"
                    >
                        ×
                    </button>
                )}
            </span>
        );

        lastIndex = h.endOffset;
    });

    // טקסט שנשאר
    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${lastIndex}`}>
                {renderTextWithBold(text.slice(lastIndex), searchTerm)}
            </span>
        );
    }

    return <>{parts}</>;
};

// פונקציה לעיבוד טקסט עם בולד
const renderTextWithBold = (text: string, highlightTerm?: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
                <strong key={i} className="font-bold text-slate-900 dark:text-white">
                    <HighlightText text={boldText} term={highlightTerm} />
                </strong>
            );
        }
        return <HighlightText key={i} text={part} term={highlightTerm} />;
    });
};

// פונקציה לעיבוד הסיכום המפורט בסגנון NotebookLM
const renderDetailedText = (
    text: string,
    highlightTerm?: string,
    highlights?: Highlight[],
    onDeleteHighlight?: (id: string) => void
) => {
    // פיצול לפי שורות
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let listItems: string[] = [];
    let numberedItems: string[] = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(' ').trim();
            if (paragraphText) {
                elements.push(
                    <p key={`p-${elements.length}`} className="text-slate-700 dark:text-slate-300 leading-relaxed text-[16px] mb-4">
                        {highlights && highlights.length > 0
                            ? renderTextWithUserHighlights(paragraphText, highlights, highlightTerm, onDeleteHighlight)
                            : renderTextWithBold(paragraphText, highlightTerm)
                        }
                    </p>
                );
            }
            currentParagraph = [];
        }
    };

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="space-y-2 mb-4 mr-4">
                    {listItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{renderTextWithBold(item, highlightTerm)}</span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    const flushNumberedList = () => {
        if (numberedItems.length > 0) {
            elements.push(
                <ol key={`ol-${elements.length}`} className="space-y-2 mb-4 mr-4">
                    {numberedItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                                {i + 1}
                            </span>
                            <span className="pt-0.5">{renderTextWithBold(item, highlightTerm)}</span>
                        </li>
                    ))}
                </ol>
            );
            numberedItems = [];
        }
    };

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        // קו הפרדה
        if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
            flushParagraph();
            flushList();
            flushNumberedList();
            if (elements.length > 0) {
                elements.push(
                    <hr key={`hr-${elements.length}`} className="border-slate-200 dark:border-slate-700 my-6" />
                );
            }
            return;
        }

        // כותרת ראשית ממוספרת (1. נושא)
        const mainHeaderMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (mainHeaderMatch && !trimmedLine.startsWith('   ')) {
            flushParagraph();
            flushList();
            flushNumberedList();
            const [, num, title] = mainHeaderMatch;
            elements.push(
                <h2 key={`h2-${elements.length}`} className="text-xl font-bold text-slate-800 dark:text-white mt-6 mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                        {num}
                    </span>
                    <span>{renderTextWithBold(title, highlightTerm)}</span>
                </h2>
            );
            return;
        }

        // רשימה עם נקודות (• או -)
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
            flushParagraph();
            flushNumberedList();
            const itemText = trimmedLine.replace(/^[•\-]\s*/, '');
            listItems.push(itemText);
            return;
        }

        // רשימה ממוספרת בתוך טקסט (1. 2. 3.)
        const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
        if (numberedMatch && listItems.length === 0 && currentParagraph.length === 0) {
            flushParagraph();
            flushList();
            numberedItems.push(numberedMatch[1]);
            return;
        } else if (numberedItems.length > 0 && numberedMatch) {
            numberedItems.push(numberedMatch[1]);
            return;
        }

        // דוגמה פשוטה
        if (trimmedLine.includes('דוגמה פשוטה:') || trimmedLine.includes('**דוגמה פשוטה:**') || trimmedLine.includes('דוגמה פשוטה למבחן')) {
            flushParagraph();
            flushList();
            flushNumberedList();
            const exampleText = trimmedLine.replace(/\*?\*?דוגמה פשוטה[^:]*:\*?\*?\s*/, '');
            elements.push(
                <div key={`ex-${elements.length}`} className="my-4 mr-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-r-4 border-amber-400 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 font-bold">
                        <span>💡</span>
                        <span>דוגמה פשוטה</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-200">
                        {renderTextWithBold(exampleText, highlightTerm)}
                    </p>
                </div>
            );
            return;
        }

        // שורה ריקה
        if (trimmedLine === '') {
            flushParagraph();
            flushList();
            flushNumberedList();
            return;
        }

        // טקסט רגיל - הוסף לפסקה
        flushList();
        flushNumberedList();
        currentParagraph.push(trimmedLine);
    });

    // סיום - flush מה שנשאר
    flushParagraph();
    flushList();
    flushNumberedList();

    return elements;
};

export const DetailedSummary: React.FC<DetailedSummaryProps> = ({
    summaryData,
    highlightTerm,
    highlights = [],
    onAddHighlight,
    onDeleteHighlight
}) => {
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Debug: Log when component renders
    console.log('[DetailedSummary] Render - onAddHighlight:', typeof onAddHighlight, 'hasDetailedSummary:', !!(summaryData.detailedSummary && summaryData.detailedSummary.trim().length > 0));

    // טיפול בבחירת טקסט
    const handleMouseUp = useCallback(() => {
        console.log('[DetailedSummary] handleMouseUp called');
        console.log('[DetailedSummary] onAddHighlight:', typeof onAddHighlight);

        if (!onAddHighlight) {
            console.log('[DetailedSummary] No onAddHighlight prop - returning');
            return;
        }

        const windowSelection = window.getSelection();
        console.log('[DetailedSummary] windowSelection:', windowSelection?.toString().substring(0, 50));

        if (!windowSelection || windowSelection.isCollapsed) {
            console.log('[DetailedSummary] No selection or collapsed - returning');
            return;
        }

        const text = windowSelection.toString().trim();
        console.log('[DetailedSummary] Selected text length:', text.length);

        if (text.length < 5) {
            console.log('[DetailedSummary] Text too short (< 5 chars) - returning');
            return; // מינימום 5 תווים
        }

        // חישוב מיקום הכפתור
        const range = windowSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // חישוב offset יחסי לטקסט המלא
        const fullText = summaryData.detailedSummary || '';
        const startOffset = fullText.indexOf(text);
        const endOffset = startOffset + text.length;

        const position = {
            x: rect.left + rect.width / 2,
            y: rect.top - 50
        };

        console.log('[DetailedSummary] Setting selection:', { text: text.substring(0, 30), startOffset, endOffset, position });

        if (startOffset === -1) {
            // אם לא מצאנו התאמה מדויקת, נשתמש בטקסט הנבחר בלי offset
            setSelection({
                text,
                startOffset: 0,
                endOffset: text.length,
                position
            });
        } else {
            setSelection({
                text,
                startOffset,
                endOffset,
                position
            });
        }
    }, [onAddHighlight, summaryData.detailedSummary]);

    const handleHighlight = useCallback(() => {
        console.log('[DetailedSummary] handleHighlight called');
        console.log('[DetailedSummary] selection:', selection);
        console.log('[DetailedSummary] onAddHighlight:', typeof onAddHighlight);

        if (!selection || !onAddHighlight) {
            console.log('[DetailedSummary] Missing selection or onAddHighlight - returning');
            return;
        }

        console.log('[DetailedSummary] Calling onAddHighlight with:', { text: selection.text.substring(0, 30), startOffset: selection.startOffset, endOffset: selection.endOffset });
        onAddHighlight(selection.text, selection.startOffset, selection.endOffset);
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, [selection, onAddHighlight]);

    const handleCloseFloating = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    // בדיקה אם יש סיכום מפורט
    const hasDetailedSummary = summaryData.detailedSummary && summaryData.detailedSummary.trim().length > 0;

    return (
        <div className="p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full pb-20">
            {/* כפתור צף לסימון */}
            {selection && (
                <FloatingHighlightButton
                    position={selection.position}
                    onHighlight={handleHighlight}
                    onClose={handleCloseFloating}
                />
            )}

            {/* הודעה על יכולת סימון */}
            {onAddHighlight && hasDetailedSummary && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                    <span>סמן טקסט כדי לשמור אותו כחשוב למבחן</span>
                </div>
            )}

            {/* סיכום מפורט - אם קיים */}
            {hasDetailedSummary ? (
                <div
                    ref={contentRef}
                    onMouseUp={handleMouseUp}
                    className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden"
                >
                    {/* כותרת */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl">
                            <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </span>
                            סיכום מפורט
                            {highlights.length > 0 && (
                                <span className="text-sm font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
                                    {highlights.length} סימונים
                                </span>
                            )}
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mr-12">
                            סיכום מקיף להכנה למבחן
                        </p>
                    </div>

                    {/* תוכן הסיכום */}
                    <div className="p-6 sm:p-8 select-text">
                        {renderDetailedText(summaryData.detailedSummary!, highlightTerm, highlights, onDeleteHighlight)}
                    </div>
                </div>
            ) : (
                /* Fallback - אם אין סיכום מפורט, הצג את המבנה הישן */
                <div className="space-y-8">
                    {/* סקירה כללית */}
                    <div className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-lg shadow-indigo-500/5">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-3 text-lg">
                            <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                </svg>
                            </span>
                            סקירה כללית
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-light">
                            <HighlightText text={summaryData.summary} term={highlightTerm} />
                        </p>
                    </div>

                    {/* נושאים מרכזיים */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-lg">
                                <span className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </span>
                                נושאים מרכזיים
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                    ({summaryData.summaryPoints.length} נושאים)
                                </span>
                            </h4>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4">
                            {summaryData.summaryPoints.map((point, index) => (
                                <div
                                    key={index}
                                    className="group bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <h5 className="font-bold text-slate-800 dark:text-white text-base leading-relaxed">
                                            <HighlightText text={point.point} term={highlightTerm} />
                                        </h5>
                                    </div>
                                    <div className="mr-10">
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
                                            <HighlightText text={point.details} term={highlightTerm} />
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
