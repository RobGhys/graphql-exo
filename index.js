const { ApolloServer, gql } = require('apollo-server')
const {v1: uuid}  = require('uuid')

let authors = [
    {
        name: 'Robert Martin',
        id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
        born: 1952,
    },
    {
        name: 'Martin Fowler',
        id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
        born: 1963
    },
    {
        name: 'Fyodor Dostoevsky',
        id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
        born: 1821
    },
    {
        name: 'Joshua Kerievsky', // birthyear not known
        id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
    },
    {
        name: 'Sandi Metz', // birthyear not known
        id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
    },
]

let books = [
    {
        title: 'Clean Code',
        published: 2008,
        author: 'Robert Martin',
        id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Agile software development',
        published: 2002,
        author: 'Robert Martin',
        id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
        genres: ['agile', 'patterns', 'design']
    },
    {
        title: 'Refactoring, edition 2',
        published: 2018,
        author: 'Martin Fowler',
        id: "afa5de00-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Refactoring to patterns',
        published: 2008,
        author: 'Joshua Kerievsky',
        id: "afa5de01-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'patterns']
    },
    {
        title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
        published: 2012,
        author: 'Sandi Metz',
        id: "afa5de02-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'design']
    },
    {
        title: 'Crime and punishment',
        published: 1866,
        author: 'Fyodor Dostoevsky',
        id: "afa5de03-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'crime']
    },
    {
        title: 'The Demon ',
        published: 1872,
        author: 'Fyodor Dostoevsky',
        id: "afa5de04-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'revolution']
    },
]

const typeDefs = gql`
  type Author {
    name: String!,
    id: ID!,
    born: Int,
    nbBooks: Int
  }
  
  type Book {
    title: String!,
    published: Int!,
    author: String!,
    id: ID!,
    genres: [String!]!
  }
  
  type Mutation {
    addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String!]!
    ): Book
    editAuthor(
        name: String!
        setBornTo: String!
    ): Author
  }
  
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author!]!
  }
`

const resolvers = {
    Query: {
        bookCount: () => books.length,

        authorCount: () => authors.length,

        allBooks: (root, args) => {
            let byFilter;

            // No parameters are given
            if (!args.author && !args.genre) return books;

            // Only the book's genre is given
            else if (!args.author) {
                byFilter = (book) => hasGenre(args.genre, book.genres) ? book.author : !book.author;
            }
            // Only the book's author is given
            else if (!args.genre) {
                byFilter = (book) => args.author === book.author ? book.author : !book.author;
            }
            // Both the book's genre & author are given
            else
                byFilter = (book) => (args.author === book.author && hasGenre(args.genre, book.genres)) ? book.author : !book.author;

            function hasGenre(genre, genres) {
                for (let i = 0; i < genres.length; i++)
                    if (genre === genres[i]) return true;
                return false;
            }

            return books.filter(byFilter);
        },

        allAuthors: () => {
            const howManyAuthors = authors.length;

            function countBooksWrittenByAuthor(author) {
                const nbBooks = books.length;
                let wroteHowManyBooks = 0;

                for (let i = 0; i < nbBooks; i++)
                    if (books[i].author === authors[author].name) wroteHowManyBooks++;
                authors[author].nbBooks = wroteHowManyBooks;
            }

            for (let j = 0; j < howManyAuthors; j++) {
                countBooksWrittenByAuthor(j);
            }
            return authors
        }
    },
    Mutation: {
        addBook: (root, args) => {
            // Add the book to books
            const book = { ...args, id: uuid() };
            books = books.concat(book);

            // Check if given author is new
            const names = authors.map(author => author.name)
            if (! names.includes(args.author)) {
                let newAuthor = {
                    id: uuid(),
                    name: args.author
                }
                // Add the new author
                authors = authors.concat(newAuthor);
            }

            return book;
        },
        editAuthor: (root, args) => {
            console.log(args)
            const author = authors.find(a => a.name === args.name);
            if (!author) return null

            const updatedAuthor = { ...author, born: args.setBornTo.valueOf() };
            authors = authors.map(a => a.name === args.name? updatedAuthor : a);

            return updatedAuthor;
        }
    }

}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})