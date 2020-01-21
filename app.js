import { app, uuid, errorHandler } from "mu";
import { Serializer } from "jsonapi-serializer";
import { OpenTDBService } from "./services/opentdb";

const openTDBService = new OpenTDBService();
const categorySerializer = new Serializer('category', {
    attributes: ["name"]
});

const triviaSerializer = new Serializer('question', {
    attributes: ["category", "difficulty", "question", "correct_answer", "incorrect_answers"]
});

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

app.use(errorHandler);