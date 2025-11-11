import { useParams } from "react-router-dom";
import ReadingLesson from "@/components/lessons/ReadingLesson";

const ReadingLessonPage = () => {
  const { lessonId } = useParams<{ lessonId?: string }>();
  return <ReadingLesson lessonId={lessonId} />;
};

export default ReadingLessonPage;
