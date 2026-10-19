import { airlineCode, airlineTone } from '../../data/airlines.js';

export default function AirlineBadge({ airline, flightNumber, size = 'md', showName = true }) {
  return (
    <span className={`airline-badge airline-${size}`}>
      <span className="airline-mono" style={{ '--tone': airlineTone(airline, flightNumber) }} aria-hidden="true">
        {airlineCode(airline, flightNumber)}
      </span>
      {showName && (
        <span className="airline-text">
          <strong>{airline}</strong>
          {flightNumber && <small>{flightNumber}</small>}
        </span>
      )}
    </span>
  );
}
