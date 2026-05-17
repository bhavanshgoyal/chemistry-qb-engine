package com.chemistryqb.backend.repository;

import com.chemistryqb.backend.model.VideoResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoResourceRepository extends JpaRepository<VideoResource, Long> {

    List<VideoResource> findByChapter(String chapter);

    List<VideoResource> findByChapterAndTopic(String chapter, String topic);

    /**
     * Find the best matching video for a question.
     * Priority: exact bloom match first, then any bloom level for the same chapter+topic.
     */
    @Query("""
        SELECT v FROM VideoResource v
        WHERE v.chapter = :chapter
          AND (v.topic = :topic OR v.topic IS NULL)
        ORDER BY
          CASE WHEN v.bloomLevel = :bloomLevel THEN 0 ELSE 1 END,
          v.createdAt DESC
        LIMIT 1
    """)
    Optional<VideoResource> findBestMatch(
        @Param("chapter") String chapter,
        @Param("topic") String topic,
        @Param("bloomLevel") Integer bloomLevel
    );
}
