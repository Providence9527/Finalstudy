// src/components/BookCard.jsx
const BookCard = ({ material }) => {
    return (
      <div className="simple-material-card">
        <img 
          src={material.thumbnail} 
          alt={material.title}
          className="material-thumbnail"
        />
        <div className="material-title">{material.title}</div>
      </div>
    )
  }
  
  export default BookCard 