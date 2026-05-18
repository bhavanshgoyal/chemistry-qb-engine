package com.chemistryqb.backend.config;

import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadData(QuestionRepository repository) {
        return args -> {
            List<Question> questions = repository.findAll();
            if (questions.isEmpty()) {
                Question q1 = new Question();
                q1.setChapter("Solutions");
                q1.setTopic("Concentration");
                q1.setBloomLevel(3);
                q1.setQuestionText("What is the molarity of a solution containing 5g of $NaOH$ in 450 mL of solution?");
                q1.setExplanation("Basic calculation");
                q1.setVideoUrl(null);   // teacher adds videos via VideoManager
                repository.save(q1);

                Question q2 = new Question();
                q2.setChapter("Electrochemistry");
                q2.setTopic("Electrochemical Cells");
                q2.setBloomLevel(5);
                q2.setQuestionText("Evaluate the effect of diluting a $0.1 M$ aqueous solution...");
                q2.setExplanation("Nernst equation application");
                q2.setVideoUrl(null);   // teacher adds videos via VideoManager
                repository.save(q2);
            }
            // Removed: no longer overwrites existing null videoUrls with fake placeholders
        };
    }
}
