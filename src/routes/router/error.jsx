/* eslint-disable react/prop-types */
export default function ErrorPage({ message }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{message || "An unexpected error occurred"}</p>
    </div>
  );
}
