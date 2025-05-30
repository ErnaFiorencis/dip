const pool = require('../../db');
const queries = require('./queries');
const {Together} = require('together-ai')

const client = new Together({ apiKey: process.env.TOGETHER_API_KEY });

const addQuestion = async (req, res) => {
    const { topic_id } = req.params;
    const { question, answers, correct_answer, active = true } = req.body;


    try {
        if (!question || !answers || answers.length !== 4 || !correct_answer) {
            console.log("Invalid question format")
            return res.status(400).send("Invalid question format");
        }

        const topicCheck = await pool.query(queries.checkTopicExists, [topic_id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).send("Topic not found");
        }

        const result = await pool.query(queries.addQuestion, [
            question,
            answers[0],
            answers[1],
            answers[2],
            answers[3],
            correct_answer,
            topic_id,
            active
        ]);

        res.status(201).json({
            message: "Question added successfully",
            question_id: result.rows[0].question_id
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error while adding question");
    }
};

const updateQuestion = async (req, res) => {
    const { question_id } = req.params;
    const { question, answers, correct_answer, active } = req.body;

    try {
        const existingQuestion = await pool.query(queries.getQuestionById, [question_id]);
        if (existingQuestion.rows.length === 0) {
            return res.status(404).send("Question not found");
        }

        const updateData = {
            question: question || existingQuestion.rows[0].question,
            answer1: answers?.[0] || existingQuestion.rows[0].answer1,
            answer2: answers?.[1] || existingQuestion.rows[0].answer2,
            answer3: answers?.[2] || existingQuestion.rows[0].answer3,
            answer4: answers?.[3] || existingQuestion.rows[0].answer4,
            correct_answer: correct_answer || existingQuestion.rows[0].correct_answer,
            active: active !== undefined ? active : existingQuestion.rows[0].active
        };

        await pool.query(queries.updateQuestion, [
            updateData.question,
            updateData.answer1,
            updateData.answer2,
            updateData.answer3,
            updateData.answer4,
            updateData.correct_answer,
            updateData.active,
            question_id
        ]);

        res.status(200).send("Question updated successfully");

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error while updating question");
    }
};

const deleteQuestion = async (req, res) => {
    const { question_id } = req.params;
    try {
        const result = await pool.query(queries.deleteQuestion, [question_id]);
        if (result.rowCount === 0) {
            return res.status(404).send("Question not found");
        }
        res.status(200).send("Question deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error while deleting question");
    }
};

const getQuestionsByTopic = async (req, res) => {
    const { topic_id } = req.params;
    try {
        const result = await pool.query(queries.getQuestionsByTopic, [topic_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching questions");
    }
};

const getActiveQuestionsByTopic = async (req, res) => {
    const { topic_id } = req.params;

    try {
        const result = await pool.query(queries.getActiveQuestionsByTopic, [topic_id]);
        // Shuffle the rows before sending them
        const shuffledRows = result.rows.sort(() => Math.random() - 0.5);
        res.status(200).json(shuffledRows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching questions");
    }
};


const getAdaptiveQuestions = async (req, res) => {
    const { topic_id } = req.params;
    
    try {
      const userRatingtry = (await pool.query(
        queries.getUserAbilityRating, 
        [req.decoded.user_id, topic_id]
      ));

      const userRating = userRatingtry.rows[0]?.ability_rating || 800;
  
      const questions = await pool.query(
        queries.getAdaptiveQuestions, [topic_id, userRating]);

      const shuffledRows = questions.rows.sort(() => Math.random() - 0.5);
      res.status(200).json(shuffledRows);
      //res.json(questions.rows);
    } catch (error) {
      console.error('Error fetching adaptive questions:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  

const getRandomQuestion = async (req, res) => {
    const { topic_id } = req.params;
    try {
        const result = await pool.query(queries.getRandomQuestion, [topic_id]);
        if (result.rows.length === 0) {
            return res.status(404).send("No questions found for this topic");
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error fetching random question");
    }
};

const generateQuestions = async (req, res) => {
    const {topic_id, count = 10, school_level, grade_level, model='meta-llama/Llama-3.3-70B-Instruct-Turbo' } = req.body;
    try {
        // Get topic info
        const topicResult = await pool.query(queries.getTopicInfo, [topic_id]);
        if (topicResult.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        const topic = topicResult.rows[0];
        

        const existingQuestions = await pool.query(queries.getQByTopic, [topic_id]);

        const systemPrompt = `Tvoj posao je generirati kviz pitanja za učenike ${grade_level}. razreda ${school_level} škole. Slijedi ova pravila:
        - Generiraj ${count} jedinstvenih pitanja o "${topic.name}"
        - Koristi jednostavan i jasan Hrvatski jezik
        - Pruži 4 moguća odgovora po pitanju
        - Samo jedan točan odgovor po pitanju
        - Ne ponavljaj već postavljena pitanja, ali ih iskoristi za inspiraciju: ${existingQuestions.rows.map(q => q.question).join(', ') || 'nema'}
        - Formatiraj odgovor kao:
        Pitanje: [pitanje]
        Odgovori: [odgovor1], [odgovor2], [odgovor3], [odgovor4]
        Točan odgovor: [broj 1-4]
        - Bez dodatnog teksta ili objašnjenja
        - Ne koristi oznake za formatiranje
        `;

        const userPrompt = `Opis teme: ${topic.description || 'Bez dodatnog opisa'}`;

        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        
        const generatedContent = response.choices[0].message.content;
        console.log(generatedContent)
        const parsedQuestions = parseAIGeneratedQuestions(generatedContent);
        console.log('Parsed Questions:', parsedQuestions);
        res.status(201).json(parsedQuestions);
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
}

const generateAdaptiveQuestions = async (req, res) => {
    const {topic_id, count = 3, school_level, grade_level, correctRate, pastQuestions } = req.body;
    try{
                // Get topic info
        const topicResult = await pool.query(queries.getTopicInfo, [topic_id]);
        if (topicResult.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        const topic = topicResult.rows[0];
        const userRatingtry = (await pool.query(
            queries.getUserAbilityRating, 
            [req.decoded.user_id, topic_id]
          ));
    
        const userRating = userRatingtry.rows[0]?.ability_rating || 800;

        let difficultyPrompt = '';
        if(correctRate > 0.7) difficultyPrompt = 'Generiraj teža pitanja sa kompleksnijim konceptima';
        else if(correctRate < 0.3) difficultyPrompt = 'Generiraj jednostavnija pitanja sa osnovnim konceptima';

        const pastQuestionsText = pastQuestions
        ?.map(q => `${q.question}`)
        ?.join(', ') || 'nema postavljenih pitanja';

        console.log('Past Questions:', pastQuestionsText);

        const systemPrompt = `
            Ti si adaptivni generator pitanja za učenike ${grade_level}. razreda ${school_level} škole.
            TRENUTNA RAZINA KORISNIKA: ${userRating} (skala 400-1600)
            TEMATIKA: ${topic.name}
            PREGLED POSTIGNUĆA: ${correctRate ? Math.round(correctRate * 100) + '% točnih odgovora' : 'nema podataka'}
            PRETHODNA PITANJA - ne ponavljaj: ${pastQuestionsText}
            
            PRAVILA:
            - Generiraj točno ${count} pitanja
            - Svako pitanje ima 4 moguća odgovora
            - Samo jedan odgovor je točan
            - Težina pitanja mora biti u rasponu ${userRating - 200}-${userRating + 200}
            - ${difficultyPrompt}
            - Koristi isključivo hrvatski jezik
            - Formatiraj odgovor kao:
            Pitanje: [pitanje]
            Odgovori: [odgovor1], [odgovor2], [odgovor3], [odgovor4]
            Točan odgovor: [broj 1-4]
            - Bez dodatnog teksta ili objašnjenja
            - Ne koristi oznake za formatiranje
        `;
        const userPrompt = `Opis teme: ${topic.description || 'Bez dodatnog opisa'}`;

        // Generate with AI
        const response = await client.chat.completions.create({
            model: 'meta-llama/Llama-3-70b-chat-hf',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: correctRate > 0.7 ? 0.3 : 0.7, // Lower temp for harder questions
            max_tokens: 1000
        });

        const generatedContent = response.choices[0].message.content;
        //console.log(generatedContent)
        const parsedQuestions = parseAIGeneratedQuestions(generatedContent);
        //console.log('Parsed Questions:', parsedQuestions);
        res.status(201).json(parsedQuestions);
    }
    catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
}

function parseAIGeneratedQuestions(content) {
    return content.split('\n\n')
      .filter(block => block.trim().length > 0)
      .map(block => {
        const lines = block.split('\n').map(line => line.trim());
        const question = lines.find(l => l.startsWith('Pitanje:'))
          ?.replace('Pitanje:', '').trim();
        
        const answers = lines.find(l => l.startsWith('Odgovori:'))
          ?.replace('Odgovori:', '')
          .split(',')
          .map(a => a.trim());
  
        const correctAnswer = parseInt(
          lines.find(l => l.startsWith('Točan odgovor:'))
            ?.replace('Točan odgovor:', '').trim()
        );
  
        if (!question || !answers || answers.length !== 4 || isNaN(correctAnswer)) {
          return null;
        }
  
        return {
          question,
          answers,
          correctAnswer
        };
      })
      .filter(q => q !== null);
  }
  
  

module.exports = {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByTopic,
    getRandomQuestion,
    getActiveQuestionsByTopic,
    generateQuestions, 
    getAdaptiveQuestions,
    generateAdaptiveQuestions
};
