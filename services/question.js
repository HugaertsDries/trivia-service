import { QuestionStore } from "./database/question";

export class QuestionService {

    constructor() {
        store = QuestionStore();
    }

    async getQuestions(params) {
        return await store.getQuestions(params)
    }

    async getCategories() {
        return await store.getCategories()
    }

    async getTypes() {
        return await store.getTypes()
    }

    async getDifficulties() {
        return await store.getDifficulties()
    }

    async getQuestion(id) {
        return await store.getQuestion(id);
    }

    async getRandomQuestions() {
        // Get (based on given params) all uri (or uuid) in the database.

        // Pick 10 (later dynamic) random uris (or uuids).

        // Retrieve all questions for the "generated" uris (or uuids).

        // return
    }

    // async getCategory(id) {
    //     return db.getCategories
    // }
}