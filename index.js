const { ApolloServer, UserInputError , gql, AuthenticationError } = require('apollo-server')
const mongoose = require('mongoose')

const Book = require('./models/book')
const Author = require('./models/author')

if (process.argv.length < 3) {
    console.log('Please provide your password as an argument: node mongo.js <password>')
    process.exit(1)
}

const password = process.argv[2]

const MONGODB_URI = `mongodb+srv://robghys:${password}@cluster0.3jic8.mongodb.net/?retryWrites=true&w=majority`

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })


let authors = []

let books = []

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
    author: Author!,
    genres: [String!]!,
    id: ID!
  }
  
  type Mutation {
    addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String!]!
    ): Book
    addAuthor(
        name: String!
        born: Int
    ) : Author
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
        bookCount: async () => Book.collection.countDocuments(),

        authorCount: async () => Author.collection.countDocuments(),

        allBooks: async (root, args) => {
            let byFilter;

            // No parameters are given
            if (!args.author && !args.genre) return Book.find({ });

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

        allAuthors: async () => Author.find({ })
    },
    Mutation: {
        addBook: async (root, args) => {
            // Add the book to books
            const book = new Book ({ ...args});
            
            try {
                await book.save()    
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }

            return book;
        },
        
        addAuthor: async (root, args) => {
            const author = new Author ({ ...args })

            try {
                await author.save()    
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }

            return author;
        },

        editAuthor: async (root, args) => {
            
            const author = await Author.findOne({ name: args.name });
            author.born = args.born;

            try {
                await author.save();    
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }

            return author;
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