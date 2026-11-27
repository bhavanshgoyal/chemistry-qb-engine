package com.chemistryqb.backend.config;

import com.chemistryqb.backend.model.Question;
import com.chemistryqb.backend.model.VideoResource;
import com.chemistryqb.backend.repository.QuestionRepository;
import com.chemistryqb.backend.repository.VideoResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Optional;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadData(
            QuestionRepository questionRepository,
            VideoResourceRepository videoResourceRepository) {
        return args -> {
            // 1. Seed sample CBSE Class 12 VideoResource records (idempotent)
            List<VideoResource> seedVideos = List.of(
                makeVideo(
                    "Solutions",
                    "Concentration",
                    "Molarity and Molality",
                    3,
                    "https://www.youtube.com/watch?v=o_iETsDSvkg",
                    "Molarity Practice Problems & Solution Concentration",
                    "Step-by-step calculations for molarity ($M$), dilutions, and mass-to-volume conversions."
                ),
                makeVideo(
                    "Solutions",
                    "Colligative Properties",
                    "Boiling Point Elevation & Depression in Freezing Point",
                    4,
                    "https://www.youtube.com/watch?v=rEYe1oyRXOQ",
                    "Colligative Properties & van't Hoff Factor",
                    "Covers vapor pressure lowering, boiling point elevation, freezing point depression, and osmotic pressure."
                ),
                makeVideo(
                    "Electrochemistry",
                    "Nernst Equation",
                    "Cell Potential under Non-Standard Conditions",
                    5,
                    "https://www.youtube.com/watch?v=jousNNceCXs",
                    "The Nernst Equation — Derivation & Numericals",
                    "Explains how electrode potential varies with ion concentration and temperature using the Nernst equation."
                ),
                makeVideo(
                    "Chemical Kinetics",
                    "Order of Reaction",
                    "Rate Law & Integrated Rate Equations",
                    3,
                    "https://www.youtube.com/watch?v=i--cMKUOOt0",
                    "Rate Law & Initial Rates Method",
                    "Determining reaction order, rate constant units, and half-life calculations for first-order kinetics."
                )
            );

            List<VideoResource> existingVideos = videoResourceRepository.findAll();
            for (VideoResource v : seedVideos) {
                boolean exists = existingVideos.stream()
                    .anyMatch(ev -> v.getYoutubeUrl().equals(ev.getYoutubeUrl()));
                if (!exists) {
                    videoResourceRepository.save(v);
                }
            }

            // 2. Seed realistic CBSE Class 12 Chemistry questions (idempotent)
            List<Question> seedQuestions = List.of(
                makeQuestion(
                    "Solutions",
                    "Concentration",
                    "Molarity",
                    3,
                    "Calculate the molarity of a solution containing $5.0\\text{ g}$ of $NaOH$ dissolved in $450\\text{ mL}$ of aqueous solution.",
                    "Molar mass of $NaOH = 40\\text{ g mol}^{-1}$. Convert volume to litres ($0.45\\text{ L}$) and use $M = \\frac{n}{V}$.",
                    "https://www.youtube.com/watch?v=o_iETsDSvkg"
                ),
                makeQuestion(
                    "Solutions",
                    "Colligative Properties",
                    "van't Hoff Factor",
                    4,
                    "Why does $0.1\\text{ M}$ $NaCl$ solution have a higher boiling point than $0.1\\text{ M}$ glucose ($C_6H_{12}O_6$) solution? Express the relation using $\\Delta T_b = i K_b m$.",
                    "Compare the van't Hoff factor $i$: $NaCl$ dissociates into $Na^+$ and $Cl^-$ ($i \\approx 2$), whereas glucose does not dissociate ($i = 1$).",
                    "https://www.youtube.com/watch?v=rEYe1oyRXOQ"
                ),
                makeQuestion(
                    "Electrochemistry",
                    "Nernst Equation",
                    "Cell Potential",
                    5,
                    "Evaluate the effect of diluting a $0.1\\text{ M}$ $CuSO_4$ half-cell to $0.001\\text{ M}$ on the electrode potential of the $Cu^{2+}/Cu$ electrode at $298\\text{ K}$ using the Nernst equation: $E = E^\\circ - \\frac{0.0591}{n}\\log\\frac{1}{[Cu^{2+}]}$.",
                    "Substitute $n = 2$ and observe how decreasing $[Cu^{2+}]$ by a factor of $100$ reduces $E$ by $0.0591\\text{ V}$.",
                    "https://www.youtube.com/watch?v=jousNNceCXs"
                ),
                makeQuestion(
                    "Electrochemistry",
                    "Conductance",
                    "Kohlrausch's Law",
                    2,
                    "State Kohlrausch's law of independent migration of ions and explain how it is used to determine $\\Lambda_m^\\circ$ for a weak electrolyte like $CH_3COOH$.",
                    "Write $\\Lambda_m^\\circ(CH_3COOH) = \\Lambda_m^\\circ(CH_3COONa) + \\Lambda_m^\\circ(HCl) - \\Lambda_m^\\circ(NaCl)$.",
                    null
                ),
                makeQuestion(
                    "Chemical Kinetics",
                    "Order of Reaction",
                    "First-Order Half-Life",
                    3,
                    "A first-order reaction is $75\\%$ complete in $60\\text{ minutes}$. Calculate its rate constant $k$ and half-life $t_{1/2}$ using $k = \\frac{2.303}{t}\\log\\frac{[R]_0}{[R]}$.",
                    "At $75\\%$ completion, $[R] = 0.25[R]_0$, which equals two half-lives ($2 \\times t_{1/2} = 60\\text{ min}$).",
                    "https://www.youtube.com/watch?v=i--cMKUOOt0"
                ),
                makeQuestion(
                    "Chemical Kinetics",
                    "Activation Energy",
                    "Catalysis",
                    4,
                    "Explain with an energy profile diagram how a catalyst increases the rate of a reversible reaction without changing $\\Delta H$ or the equilibrium constant $K_{eq}$.",
                    "A catalyst provides an alternative pathway with lower activation energy $E_a$ for both forward and reverse reactions equally.",
                    null
                ),
                makeQuestion(
                    "Coordination Compounds",
                    "Bonding in Coordination Compounds",
                    "Crystal Field Theory",
                    4,
                    "Using Crystal Field Theory, explain why $[Fe(CN)_6]^{4-}$ is diamagnetic while $[Fe(H_2O)_6]^{2+}$ is paramagnetic ($Fe^{2+}$ has $3d^6$ configuration).",
                    "Compare ligand field strength: $CN^-$ is a strong-field ligand ($\\Delta_o > P$, pairing occurs to give $t_{2g}^6 e_g^0$), whereas $H_2O$ is weak-field ($t_{2g}^4 e_g^2$).",
                    null
                ),
                makeQuestion(
                    "Aldehydes, Ketones and Carboxylic Acids",
                    "Chemical Properties",
                    "Aldol Condensation",
                    5,
                    "Propanal ($CH_3CH_2CHO$) undergoes aldol condensation in dilute $NaOH$, whereas methanal ($HCHO$) undergoes the Cannizzaro reaction in concentrated $NaOH$. Justify this difference structurally.",
                    "Aldol condensation requires at least one $\\alpha$-hydrogen atom; $HCHO$ lacks $\\alpha$-hydrogens and undergoes disproportionation.",
                    null
                )
            );

            // Clean up legacy truncated placeholder question if it exists
            List<Question> existingQuestions = questionRepository.findAll();
            for (Question eq : existingQuestions) {
                if ("Evaluate the effect of diluting a $0.1 M$ aqueous solution...".equals(eq.getQuestionText())) {
                    eq.setTopic("Nernst Equation");
                    eq.setSubTopic("Cell Potential");
                    eq.setQuestionText(seedQuestions.get(2).getQuestionText());
                    eq.setExplanation(seedQuestions.get(2).getExplanation());
                    eq.setVideoUrl(seedQuestions.get(2).getVideoUrl());
                    questionRepository.save(eq);
                } else if (eq.getVideoUrl() == null && eq.getChapter() != null) {
                    Optional<VideoResource> match = videoResourceRepository.findBestMatch(
                        eq.getChapter(),
                        eq.getTopic() != null ? eq.getTopic() : "",
                        eq.getBloomLevel()
                    );
                    if (match.isPresent()) {
                        eq.setVideoUrl(match.get().getYoutubeUrl());
                        questionRepository.save(eq);
                    }
                }
            }

            for (Question q : seedQuestions) {
                if (!questionRepository.existsByQuestionText(q.getQuestionText())) {
                    questionRepository.save(q);
                }
            }
        };
    }

    private static VideoResource makeVideo(
            String chapter,
            String topic,
            String subTopic,
            Integer bloomLevel,
            String youtubeUrl,
            String title,
            String description) {
        VideoResource v = new VideoResource();
        v.setChapter(chapter);
        v.setTopic(topic);
        v.setSubTopic(subTopic);
        v.setBloomLevel(bloomLevel);
        v.setYoutubeUrl(youtubeUrl);
        v.setTitle(title);
        v.setDescription(description);
        return v;
    }

    private static Question makeQuestion(
            String chapter,
            String topic,
            String subTopic,
            Integer bloomLevel,
            String questionText,
            String explanation,
            String videoUrl) {
        Question q = new Question();
        q.setChapter(chapter);
        q.setTopic(topic);
        q.setSubTopic(subTopic);
        q.setBloomLevel(bloomLevel);
        q.setQuestionText(questionText);
        q.setExplanation(explanation);
        q.setVideoUrl(videoUrl);
        return q;
    }
}
