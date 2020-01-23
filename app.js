import { app, uuid, errorHandler } from "mu";
import { Serializer } from "jsonapi-serializer";
import { OpenTDBService } from "./services/opentdb";
import { QuestionDB } from "./database/question";

const openTDBService = new OpenTDBService();
const questionDB = new QuestionDB;

const categorySerializer = new Serializer('category', {
    attributes: ["name"]
});

const triviaSerializer = new Serializer('question', {
    attributes: [
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
app.get('/questions', function (req, res) {
    // let { amount, type, difficulty, category } = req.query
    openTDBService.getTrivia(req.query).then((data) => {
        data.forEach(((question) => question.id = uuid()));
        var questions = triviaSerializer.serialize(data);
        res.send(questions);
    });
});

// GET Categories
app.get('/questions/categories', function (req, res) {
    openTDBService.getCategories().then((data) => {
        var categories = categorySerializer.serialize(data);
        res.send(categories);
    });
});

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

// TODO add crone job that loads in questions
app.get('/test', function (req, res) {
    // request a random trivia form the opentbd.
    openTDBService.getTrivia({ amount: 0 }).then((data) => {
        // let trivia = data[0]
        // add it to our triplestore
        questionDB.addQuestions(data);
        // request it back from our triplestore
        //questionDB.getQuestion(uuid).then((d) => {
        //    res.send(d);
        //});
        questionDB.getQuestions().then((data) => {
            var questions = triviaSerializer.serialize(data);
            res.send(questions);
        });
        // res.send("Successfully added 50 new Questions");
    });
});

// GET Questions from TripleStore
app.get('/q', function (req, res) {
    questionDB.getQuestions().then((data) => {
        var questions = triviaSerializer.serialize(data);
        res.send(questions);
    });
});

// GET Question for id from TripleStore
app.get('/q/:id', function (req, res) {
    questionDB.getQuestion(req.params.id).then((data) => {
        res.send(triviaSerializer.serialize(data));
    });
});

app.use(errorHandler);