package com.chemistryqb.backend.service;

import com.chemistryqb.backend.model.QuestionAttempt;
import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.chemistryqb.backend.dto.RemediationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RemediationService {

    @Autowired
    private QuestionRepository questionRepository;

    public RemediationDTO getRemediation(List<QuestionAttempt> currentAttempts) {
        if (currentAttempts == null || currentAttempts.isEmpty()) {
            return new RemediationDTO("No attempts recorded.", null);
        }

        for (QuestionAttempt attempt : currentAttempts) {
            if (Boolean.TRUE.equals(attempt.getIsSkipped())) {
                Question q = questionRepository.findById(attempt.getQuestionId()).orElse(null);
                if (q != null && q.getVideoUrl() != null) {
                    return new RemediationDTO("You skipped a question on " + q.getTopic() + ". Here is a video to help.", q.getVideoUrl());
                }
            }
        }

        double totalConfidence = 0;
        int correctCount = 0;
        for (QuestionAttempt attempt : currentAttempts) {
            totalConfidence += attempt.getConfidenceLevel() != null ? attempt.getConfidenceLevel() : 3;
            if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
                correctCount++;
            }
        }
        
        double avgConfidence = totalConfidence / currentAttempts.size();
        double scorePercentage = (double) correctCount / currentAttempts.size() * 100;

        if (avgConfidence < 2.0) {
            return new RemediationDTO("It seems you're struggling with confidence across these topics. Let's start with a Chapter Overview.", null);
        }

        if (scorePercentage < 40.0) {
            Map<String, Long> errorCounts = currentAttempts.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsCorrect()) && !Boolean.TRUE.equals(a.getIsSkipped()))
                .map(a -> questionRepository.findById(a.getQuestionId()).orElse(null))
                .filter(q -> q != null && q.getTopic() != null)
                .collect(Collectors.groupingBy(Question::getTopic, Collectors.counting()));
            
            String worstTopic = errorCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General");

            return new RemediationDTO("Your score is below 40%. It looks like you're having trouble with " + worstTopic + ". Here's a foundational video.", null);
        }

        return new RemediationDTO("Great job! Keep up the good work.", null);
    }
}
