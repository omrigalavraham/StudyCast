import { useState } from 'react';
import { Course, Lecture, FileData } from '../types';

export const useModalState = () => {
  // --- UI State for adding items ---
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [newLectureName, setNewLectureName] = useState('');

  // --- UI State for EDITING items ---
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');

  const [editingLecture, setEditingLecture] = useState<{ lecture: Lecture, courseId: string } | null>(null);
  const [editLectureName, setEditLectureName] = useState('');

  // --- UI State for Processing Mode ---
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<FileData | null>(null);

  // --- UI State for Preview Mode ---
  const [previewLecture, setPreviewLecture] = useState<Lecture | null>(null);

  // --- UI State for Meta-Lecture Creation ---
  const [isMetaLectureModalOpen, setIsMetaLectureModalOpen] = useState(false);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [metaLectureName, setMetaLectureName] = useState('');

  return {
    // Add Course Modal
    isAddCourseModalOpen,
    setIsAddCourseModalOpen,
    newCourseName,
    setNewCourseName,
    // Add Lecture Modal
    isAddLectureModalOpen,
    setIsAddLectureModalOpen,
    newLectureName,
    setNewLectureName,
    // Edit Course Modal
    editingCourse,
    setEditingCourse,
    editCourseName,
    setEditCourseName,
    // Edit Lecture Modal
    editingLecture,
    setEditingLecture,
    editLectureName,
    setEditLectureName,
    // Processing Modal
    isProcessingModalOpen,
    setIsProcessingModalOpen,
    pendingFile,
    setPendingFile,
    // Preview Modal
    previewLecture,
    setPreviewLecture,
    // Meta-Lecture Modal
    isMetaLectureModalOpen,
    setIsMetaLectureModalOpen,
    selectedLectureIds,
    setSelectedLectureIds,
    metaLectureName,
    setMetaLectureName
  };
};
