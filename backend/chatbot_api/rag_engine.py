import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

vector_db = None


def get_embeddings():

    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def init_vector_db():
    global vector_db

    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)

    # If DB already exists, load it directly
    if os.path.exists(DB_DIR) and os.listdir(DB_DIR):
        print("Loading existing vector database...")

        vector_db = Chroma(
            persist_directory=DB_DIR,
            embedding_function=get_embeddings()
        )

        return vector_db

    print("Creating new vector database...")

    loader = DirectoryLoader(
        DOCS_DIR,
        glob="**/*.txt",
        loader_cls=TextLoader
    )

    documents = loader.load()

    if not documents:
        vector_db = Chroma(
            embedding_function=get_embeddings(),
            persist_directory=DB_DIR
        )
        return vector_db

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    docs = text_splitter.split_documents(documents)

    vector_db = Chroma.from_documents(
        docs,
        embedding=get_embeddings(),
        persist_directory=DB_DIR
    )

    vector_db.persist()

    print("Vector database created successfully.")

    return vector_db


def get_vector_db():
    global vector_db

    if vector_db is None:
        vector_db = Chroma(
            persist_directory=DB_DIR,
            embedding_function=get_embeddings()
        )

    return vector_db


def search_documents(query: str, k: int = 3):
    db = get_vector_db()

    results = db.similarity_search(query, k=k)

    return "\n\n".join(
        [doc.page_content for doc in results]
    )