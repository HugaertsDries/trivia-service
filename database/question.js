import { query, update } from 'mu';
import uuidv5 from 'uuid/v5';

const PREFIX_QUESTIONS = "http://qmino/data/questions/";
const PREFIX_Q_CATEGORIES = "http://qmino/data/question/categories/";
const PREFIX_PRE_EXT_TRIVIA = "http://qmino/vocabularies/ext/trivia";
const PREFIX_PRE_CORE = "http://qmino/vocabularies/core/";

const NAMESPACE = "7d96e81d-bfad-4e08-b820-1d5ff04b1972";

export class QuestionStore {

    // DONE
    async addQuestion(question) {
        let questionId = uuidv5(question.question, NAMESPACE);
        let categoryId = uuidv5(question.category, NAMESPACE);

        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vtc: <${PREFIX_PRE_EXT_TRIVIA}/category>
        PREFIX vc:  <${PREFIX_PRE_CORE}>

        INSERT DATA {
            GRAPH <http://mu.semte.ch/application> { 
                <${PREFIX_QUESTIONS}${questionId}> 
                    rdf:type vet:Trivia ; 
                    vc:uuid "${questionId}" ;
                    vet:category <${PREFIX_Q_CATEGORIES}${questionId}> ;
                    vet:type "${question.type}" ;
                    vet:difficulty "${question.difficulty}" ;
                    vet:question "${question.question}" ;
                    vet:correct_answer "${question.correct_answer}" ;
                    ${(question.incorrect_answers.map((answer) => `vet:incorrect_answer "${answer}"`).join(" ; ") + " .")}

                <${PREFIX_Q_CATEGORIES}${questionId}>
                    rdf:type vtc:Category ;
                    vc:uuid "${categoryId}" ;
                    vtc:name "${question.category}" .
            }
        }
        `
        await update(q);
        return questionId;
    }

    addQuestions(questions) {
        questions.forEach(question => {
            this.addQuestion(question);
        });
    }

    // DONE
    async getQuestion(uuid) {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vtc: <${PREFIX_PRE_EXT_TRIVIA}/category>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type vet:Trivia . 
                ?uri vc:uuid "${uuid}" .
                ?uri vc:uuid ?id .
                ?uri vet:category ?curi .
                ?uri vtc:name ?category .
                ?uri vet:type ?type .
                ?uri vet:difficulty ?difficulty .
                ?uri vet:question ?question .
                ?uri vet:correct_answer ?correct_answer .
            }
        }
        `

        let res = await query(q);
        let transformed = this.transformBindingsToQuestions(res.results.bindings);
        return transformed;

    }

    // DONE
    async getQuestions(params) {
        const { amount, offset, type, category, difficulty } = params
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vtc: <${PREFIX_PRE_EXT_TRIVIA}/category>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> { 
                ?uri rdf:type vet:Trivia .
                ?uri vc:uuid ?id .
                ?uri vet:category ?curi .
                ?curi vc:uuid ?cid .
                ?curi vtc:name ?category .
                ?uri vet:type ?type .
                ?uri vet:difficulty ?difficulty .
                ?uri vet:question ?question .
                ?uri vet:correct_answer ?correct_answer .
                ${type ? `FILTER(?type = "${type}") .` : ""}
                ${difficulty ? `FILTER(?difficulty = "${difficulty}") .` : ""}
                ${category ? `FILTER(?cid = "${category}")` : ""}
            }
        }
        ${amount ? `LIMIT ${amount}` : ""}
        ${(offset >= 1) ? `OFFSET ${offset}` : ""}
        `
        let res = await query(q);
        let transformed = await this.transformBindingsToQuestions(res.results.bindings);
        return transformed;
    }

    // DONE
    async getIncorrectAnswers(uuid) {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?incorrect_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> { 
                ?uri rdf:type vet:Trivia .
                ?uri vc:uuid "${uuid}" .
                ?uri vet:incorrect_answer ?incorrect_answer .
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
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vtc: <${PREFIX_PRE_EXT_TRIVIA}/category>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?uuid ?name
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type vtc:Category .
                ?uri vc:uuid ?uuid . 
                ?uri vtc:name ?name .
            }
        }
        ORDER BY ?name
        `
        let res = await query(q);
        let categories = res.results.bindings.map((binding) => {
            return {
                id: binding.uuid.value,
                name: binding.name.value
            }
        });
        return categories;
    }

    // TODO Better order
    async getDifficulties() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?difficulty
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type vet:Trivia . 
                ?uri vet:difficulty ?difficulty .
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
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT DISTINCT ?type
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type vet:Trivia . 
                ?uri vet:type ?type .
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

    // TODO add params {type, category, difficulty, ...}
    async getAmountQuestions(params) {
        const { type, category, difficulty } = params
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX vet: <${PREFIX_PRE_EXT_TRIVIA}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT COUNT(?uri) AS ?count
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type vet:Trivia .
                ?uri vet:category ?curi .
                ?curi vc:uuid ?cid .
                ?uri vet:type ?type .
                ?uri vet:difficulty ?difficulty .
                ${type ? `FILTER(?type = "${type}") .` : ""}
                ${difficulty ? `FILTER(?difficulty = "${difficulty}") .` : ""}
                ${category ? `FILTER(?cid = "${category}")` : ""} 
            }
        }
        `
        let res = await query(q);
        return res.results.bindings[0].count.value;
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