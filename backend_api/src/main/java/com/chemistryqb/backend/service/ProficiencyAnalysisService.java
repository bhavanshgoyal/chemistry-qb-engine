package com.chemistryqb.backend.service;

import org.springframework.stereotype.Service;

@Service
public class ProficiencyAnalysisService {
    
    public String calculateMasteryScore(double averageCorrectBloomLevel) {
        if (averageCorrectBloomLevel >= 4.0) {
            return "High";
        } else if (averageCorrectBloomLevel >= 3.0) {
            return "Intermediate";
        } else {
            return "Foundation Level";
        }
    }
    
    public String determineNextAction(int attemptedBloomLevel, boolean isCorrect, String topic) {
        if (!isCorrect && attemptedBloomLevel >= 5) {
            return "Try a Level 3 question in " + topic + " to rebuild foundations.";
        } else if (!isCorrect) {
            return "Review the core concepts for " + topic + " before attempting again.";
        } else if (isCorrect && attemptedBloomLevel < 6) {
            return "Great job! Ready for a Level " + (attemptedBloomLevel + 1) + " challenge in " + topic + ".";
        }
        return "Excellent! You have mastered this topic.";
    }
}
