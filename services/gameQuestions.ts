
export type QuestionType = 'MATH' | 'ENGLISH';

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    type: QuestionType;
}

export const generateQuestion = (type: QuestionType, age?: number): Question => {
    switch (type) {
        case 'MATH': return generateMathQuestion(age);
        case 'ENGLISH': return generateEnglishQuestion(age);
        default: return generateMathQuestion(age);
    }
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMathQuestion = (age: number = 8): Question => {
    // Default age 8 if not provided (or 0)
    const safeAge = age || 8;
    
    let a, b, result;
    let operator = Math.random() > 0.5 ? '+' : '-';
    let maxNumber = 20;

    // Difficulty based on Age
    if (safeAge < 7) {
        // Ages 3-6: Very simple addition/subtraction up to 10
        maxNumber = 10;
    } else if (safeAge >= 7 && safeAge <= 8) {
        // Ages 7-8: Up to 20
        maxNumber = 20;
    } else if (safeAge >= 9 && safeAge <= 10) {
        // Ages 9-10: Up to 50, include Multiplication
        maxNumber = 50;
        if (Math.random() > 0.6) operator = '*';
    } else {
        // Ages 11+: Up to 100, include Multiplication/Division
        maxNumber = 100;
        const rand = Math.random();
        if (rand > 0.66) operator = '*';
        else if (rand > 0.33) operator = '/';
    }

    if (operator === '+') {
        a = getRandomInt(1, maxNumber);
        b = getRandomInt(1, maxNumber);
        result = a + b;
    } else if (operator === '-') {
        a = getRandomInt(Math.floor(maxNumber/2), maxNumber); // Ensure 'a' is somewhat large
        b = getRandomInt(1, a); // ensure positive result
        result = a - b;
    } else if (operator === '*') {
        // Multiplication (keep numbers smaller)
        const limit = safeAge > 10 ? 12 : 5;
        a = getRandomInt(1, limit);
        b = getRandomInt(1, limit);
        result = a * b;
    } else {
        // Division (must result in integer)
        const limit = 12;
        const divisor = getRandomInt(1, limit);
        const quotient = getRandomInt(1, limit);
        b = divisor;
        a = divisor * quotient;
        result = quotient;
    }

    const correctAnswer = result.toString();
    const options = new Set<string>();
    options.add(correctAnswer);
    
    // Generate distinct wrong answers
    while (options.size < 3) {
        const offset = getRandomInt(-5, 5);
        if (offset === 0) continue;
        
        let wrong = result + offset;
        if (wrong < 0) wrong = Math.abs(wrong); // avoid negative options for simplicity if desired
        
        if (wrong !== result) options.add(wrong.toString());
    }

    const text = `${a} ${operator === '*' ? '×' : (operator === '/' ? '÷' : operator)} ${b} = ?`;
    
    // Use text as ID to prevent duplicate questions (e.g. 5+5 appearing twice)
    return {
        id: text.replace(/\s/g, ''),
        text: text,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'MATH'
    };
};

const englishWordsBasic = [
    // Animals
    { cs: 'Pes', en: 'Dog' }, { cs: 'Kočka', en: 'Cat' }, { cs: 'Prase', en: 'Pig' },
    { cs: 'Kůň', en: 'Horse' }, { cs: 'Kráva', en: 'Cow' }, { cs: 'Ovce', en: 'Sheep' },
    { cs: 'Lev', en: 'Lion' }, { cs: 'Slon', en: 'Elephant' }, { cs: 'Opice', en: 'Monkey' },
    { cs: 'Ryba', en: 'Fish' }, { cs: 'Pták', en: 'Bird' }, { cs: 'Myš', en: 'Mouse' },
    
    // Food
    { cs: 'Jablko', en: 'Apple' }, { cs: 'Banán', en: 'Banana' }, { cs: 'Pomeranč', en: 'Orange' },
    { cs: 'Chléb', en: 'Bread' }, { cs: 'Voda', en: 'Water' }, { cs: 'Mléko', en: 'Milk' },
    { cs: 'Vejce', en: 'Egg' }, { cs: 'Sýr', en: 'Cheese' }, { cs: 'Dort', en: 'Cake' },
    { cs: 'Zmrzlina', en: 'Ice cream' }, { cs: 'Maso', en: 'Meat' }, { cs: 'Jahoda', en: 'Strawberry' },

    // Colors
    { cs: 'Červená', en: 'Red' }, { cs: 'Modrá', en: 'Blue' }, { cs: 'Zelená', en: 'Green' },
    { cs: 'Žlutá', en: 'Yellow' }, { cs: 'Černá', en: 'Black' }, { cs: 'Bílá', en: 'White' },
    { cs: 'Růžová', en: 'Pink' }, { cs: 'Fialová', en: 'Purple' }, { cs: 'Oranžová', en: 'Orange' },
    
    // Home & Objects
    { cs: 'Auto', en: 'Car' }, { cs: 'Dům', en: 'House' }, { cs: 'Kniha', en: 'Book' },
    { cs: 'Stůl', en: 'Table' }, { cs: 'Židle', en: 'Chair' }, { cs: 'Postel', en: 'Bed' },
    { cs: 'Tužka', en: 'Pencil' }, { cs: 'Míč', en: 'Ball' }, { cs: 'Hračka', en: 'Toy' },
    { cs: 'Boty', en: 'Shoes' }, { cs: 'Tričko', en: 'T-shirt' }, { cs: 'Hodiny', en: 'Clock' },

    // Body
    { cs: 'Hlava', en: 'Head' }, { cs: 'Ruka', en: 'Hand' }, { cs: 'Noha', en: 'Leg' },
    { cs: 'Oko', en: 'Eye' }, { cs: 'Ucho', en: 'Ear' }, { cs: 'Nos', en: 'Nose' }
];

const englishWordsAdvanced = [
    // Verbs
    { cs: 'Běhat', en: 'Run' }, { cs: 'Skákat', en: 'Jump' }, { cs: 'Plavat', en: 'Swim' },
    { cs: 'Číst', en: 'Read' }, { cs: 'Psát', en: 'Write' }, { cs: 'Mluvit', en: 'Speak' },
    { cs: 'Jíst', en: 'Eat' }, { cs: 'Pít', en: 'Drink' }, { cs: 'Spát', en: 'Sleep' },
    { cs: 'Myslet', en: 'Think' }, { cs: 'Učit se', en: 'Learn' }, { cs: 'Hrát', en: 'Play' },

    // School & Abstract
    { cs: 'Škola', en: 'School' }, { cs: 'Učitel', en: 'Teacher' }, { cs: 'Žák', en: 'Student' },
    { cs: 'Matematika', en: 'Math' }, { cs: 'Dějepis', en: 'History' }, { cs: 'Věda', en: 'Science' },
    { cs: 'Hudba', en: 'Music' }, { cs: 'Pravítko', en: 'Ruler' }, { cs: 'Počítač', en: 'Computer' },

    // Nature & Weather
    { cs: 'Počasí', en: 'Weather' }, { cs: 'Bouřka', en: 'Storm' }, { cs: 'Mrak', en: 'Cloud' },
    { cs: 'Vítr', en: 'Wind' }, { cs: 'Les', en: 'Forest' }, { cs: 'Hora', en: 'Mountain' },
    { cs: 'Jezero', en: 'Lake' }, { cs: 'Země', en: 'Earth' }, { cs: 'Vesmír', en: 'Space' },

    // Emotions & States
    { cs: 'Šťastný', en: 'Happy' }, { cs: 'Smutný', en: 'Sad' }, { cs: 'Rozzlobený', en: 'Angry' },
    { cs: 'Unavený', en: 'Tired' }, { cs: 'Hladový', en: 'Hungry' }, { cs: 'Žíznivý', en: 'Thirsty' },
    
    // Time
    { cs: 'Ráno', en: 'Morning' }, { cs: 'Večer', en: 'Evening' }, { cs: 'Noc', en: 'Night' },
    { cs: 'Dnes', en: 'Today' }, { cs: 'Včera', en: 'Yesterday' }, { cs: 'Zítra', en: 'Tomorrow' },
    { cs: 'Týden', en: 'Week' }, { cs: 'Měsíc', en: 'Month' }, { cs: 'Rok', en: 'Year' }
];

const generateEnglishQuestion = (age: number = 8): Question => {
    // Select vocabulary based on age
    // Age 9+ gets advanced words mixed with some basic words, or just advanced pool
    // To ensure variety, let's use the advanced pool for older kids, or a mix.
    // Let's strictly use Advanced pool for 9+ to ensure "harder" questions as requested.
    
    const vocabulary = age >= 9 ? englishWordsAdvanced : englishWordsBasic;
    
    const word = vocabulary[getRandomInt(0, vocabulary.length - 1)];
    const correctAnswer = word.en;
    
    const options = new Set<string>();
    options.add(correctAnswer);
    
    while (options.size < 3) {
        const wrong = vocabulary[getRandomInt(0, vocabulary.length - 1)].en;
        if (wrong !== correctAnswer) options.add(wrong);
    }

    return {
        id: `EN_${word.en}`, // Use word as ID to prevent duplicates
        text: `Jak se řekne anglicky "${word.cs}"?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'ENGLISH'
    };
};
