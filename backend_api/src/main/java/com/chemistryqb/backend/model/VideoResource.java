package com.chemistryqb.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Represents a teacher's YouTube video resource, tagged to a specific
 * chapter + topic + Bloom's level. When a question is ingested that matches
 * these tags, it is automatically assigned this video URL.
 */
@Entity
@Table(name = "video_resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** CBSE chapter name, e.g. "Electrochemistry" */
    private String chapter;

    /** Sub-topic within the chapter, e.g. "Nernst Equation" */
    private String topic;

    /** Optional sub-topic for finer matching */
    private String subTopic;

    /**
     * Bloom's taxonomy level (1-6):
     * 1=Remembering, 2=Understanding, 3=Applying, 4=Analyzing, 5=Evaluating, 6=Creating
     * Null = matches any level in this chapter/topic
     */
    private Integer bloomLevel;

    /** Unlisted YouTube URL, e.g. https://www.youtube.com/watch?v=abc123 */
    @Column(nullable = false)
    private String youtubeUrl;

    /** Human-readable title shown in the dashboard */
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
