import { query, update } from 'mu';
import uuidv5 from 'uuid/v5';

const PREFIX_QUESTIONS = "http://qmino/data/questions/";
const PREFIX_PRE_EXT = "http://qmino/vocabularies/ext/trivia";
const PREFIX_PRE_CORE = "http://qmino/vocabularies/core/";

const NAMESPACE = "7d96e81d-bfad-4e08-b820-1d5ff04b1972";

export class QuestionDB {

    // DONE
    async addQuestion(question) {
        let uuid = uuidv5(question.question, NAMESPACE);
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>

        INSERT DATA {
            GRAPH <http://mu.semte.ch/application> { 
                <${PREFIX_QUESTIONS}${uuid}> 
                    rdf:type ve:Trivia ; 
                    vc:uuid "${uuid}" ;
                    ve:category "${question.category}" ;
                    ve:type "${question.type}" ;
                    ve:difficulty "${question.difficulty}" ;
                    ve:question "${question.question}" ;
                    ve:correct_answer "${question.correct_answer}" ;
                    ${question.incorrect_answers.map((answer) => `ve:incorrect_answer "${answer}"`).join(" ; ")}
            }
        }
        `
        await update(q);
        return uuid;
    }

    addQuestions(questions) {
        questions.forEach(question => {
            this.addQuestion(question);
        });
    }

    // TODO add params {amount, type, category, difficulty, ...}
    async getQuestion(uuid) {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type ve:Trivia . 
                ?uri vc:uuid "${uuid}" .
                ?uri vc:uuid ?id .
                ?uri ve:category ?category .
                ?uri ve:type ?type .
                ?uri ve:difficulty ?difficulty .
                ?uri ve:question ?question .
                ?uri ve:correct_answer ?correct_answer .
            }
        }
        `

        let res = await query(q);
        let transformed = this.transformBindingsToQuestions(res.results.bindings);
        return transformed;

    }

    // TODO add params {amount, type, category, difficulty, ...}
    async getQuestions() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> { 
                ?uri rdf:type ve:Trivia .
                ?uri vc:uuid ?id .
                ?uri ve:category ?category .
                ?uri ve:type ?type .
                ?uri ve:difficulty ?difficulty .
                ?uri ve:question ?question .
                ?uri ve:correct_answer ?correct_answer .
            }
        }
        LIMIT 50
        `
        let res = await query(q);
        let transformed = await this.transformBindingsToQuestions(res.results.bindings);
        return transformed;
    }

    // DONE
    async getIncorrectAnswers(uuid) {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?incorrect_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> { 
                ?uri rdf:type ve:Trivia .
                ?uri vc:uuid "${uuid}" .
                ?uri ve:incorrect_answer ?incorrect_answer .
            }
        }
        `
        let res = await query(q);
        let answers = res.results.bindings.map((binding) => binding.incorrect_answer.value);
        return answers
    }

    // TODO Add id (should be consistent, order?) + transform.
    async getCategories() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?category
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type ve:Trivia . 
                ?uri ve:category ?category .
            }
        }
        ORDER BY ?category
        `
        let res = await query(q);
        let categories = res.results.bindings.map((binding, index) => {
            return {
                id: index,
                name: binding.category.value
            }
        });
        return categories;
    }

    // TODO Better order
    async getDifficulties() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?difficulty
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type ve:Trivia . 
                ?uri ve:difficulty ?difficulty .
            }
        }
        ORDER BY ?difficulty
        `
        let res = await query(q);
        let difficulties = res.results.bindings.map((binding) => {
            return {
                id: binding.difficulty.value.toLowerCase(),
                name: binding.difficulty.value
            }
        });
        return difficulties;
    }

    // DONE
    async getTypes() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?type
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type ve:Trivia . 
                ?uri ve:type ?type .
            }
        }
        ORDER BY ?type
        `
        let res = await query(q);
        let types = res.results.bindings.map((binding) => {
            return {
                id: binding.type.value.toLowerCase(),
                name: binding.type.value
            }
        });
        return types;
    }

    // TODO move this to dedicated transformation.js
    async transformBindingsToQuestions(bindings) {
        let questions = [];
        for (let binding of bindings) {
            questions.push(await this.transformBindingToQuestion(binding));
        }
        return questions;
    }

    // TODO move this to dedicated transformation.js
    async transformBindingToQuestion(binding) {
        let incorrect_answers = await this.getIncorrectAnswers(binding.id.value);
        return {
            id: binding.id.value,
            category: binding.category.value,
            type: binding.type.value,
            difficulty: binding.difficulty.value,
            question: binding.question.value,
            correct_answer: binding.correct_answer.value,
            incorrect_answers
        }
    }


}