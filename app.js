import { app, uuid, errorHandler } from "mu";
import { Serializer } from "jsonapi-serializer";
import { OpenTDBService } from "./services/opentdb";
import { QuestionService } from "./services/question";

const openTDBService = new OpenTDBService();
const questionService = new QuestionService();

const typeSerializer = new Serializer('type', {
    attributes: ["name"]
});

const difficultySerializer = new Serializer('difficulty', {
    attributes: ["name"]
});

const categorySerializer = new Serializer('category', {
    attributes: ["name"]
});

const triviaSerializer = new Serializer('question', {
    attributes: [
        "type",
        "category",
        "difficulty",
        "question",
        "correct_answer",
        "incorrect_answers"
    ]
});

// TODO add crone job that loads in questions

// GET random trivia
app.get('/trivia', function (req, res) {
    openTDBService.getTrivia({ amount: 10, type: "boolean" }).then((data) => {
        let trivia = data.find((trivia) => trivia.correct_answer = "True");
        res.send(triviaSerializer.serialize(trivia));
    });
});

// GET Questions
// app.get('/questions', function (req, res) {
//     // let { amount, type, difficulty, category } = req.query
//     openTDBService.getTrivia(req.query).then((data) => {
//         data.forEach(((question) => question.id = uuid()));
//         var questions = triviaSerializer.serialize(data);
//         res.send(questions);
//     });
// });

// GET Categories
// app.get('/questions/categories', function (req, res) {
//     openTDBService.getCategories().then((data) => {
//         var categories = categorySerializer.serialize(data);
//         res.send(categories);
//     });
// });

// GET Categories for id
app.get('/questions/categories/:categoryId', function (req, res) {
    openTDBService.getCategories().then((data) => {
        let cat = categorySerializer.serialize(
            data.filter(cat => cat.id == req.params.categoryId)
        );
        res.send(cat);
    });
});

// TESTING
// ----------------------------------------------------------------

// TODO add crone job that loads in questions
app.get('/fill', function (req, res) {
    openTDBService.getTrivia({ amount: 50 }).then((data) => {
        questionService.addQuestions(data);
        // console.log("Successfully added new Questions")
        res.send("Successfully added new Questions");
    });
});

// GET Questions from TripleStore
app.get('/questions', function (req, res) {
    questionService.getQuestions(req.query).then((data) => {
        var questions = triviaSerializer.serialize(data);
        res.send(questions);
    });
});

// GET Question for id from TripleStore
app.get('/questions/:id', function (req, res) {
    questionService.getQuestion(req.params.id).then((data) => {
        res.send(triviaSerializer.serialize(data));
    });
});

app.get('/question/categories', function (req, res) {
    questionService.getCategories().then(data => {
        var categories = categorySerializer.serialize(data);
        res.send(categories);
    });
});

app.get('/question/categories/:id', function (req, res) {
    questionService.getCategory(req.params.id).then(data => {
        var categories = categorySerializer.serialize(data);
        res.send(categories);
    });
});

app.get('/question/difficulties', function (req, res) {
    questionService.getDifficulties().then(data => {
        var difficulties = difficultySerializer.serialize(data);
        res.send(difficulties);
    });
});

app.get('/question/types', function (req, res) {
    questionService.getTypes().then(data => {
        var types = typeSerializer.serialize(data);
        res.send(types);
    });
});

// TODO
app.get('/random/questions', function (req, res) {
    questionService.getRandomQuestions(req.query).then(data => {
        var questions = triviaSerializer.serialize(data);
        res.send(questions);
    })
    // res.send("a Random set of question will be found here ....");
});


app.use(errorHandler);