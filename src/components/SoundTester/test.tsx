export default function TestComp() {
  let a: number | null = null;

  function setA() {
    a = 10;
    console.log(a);
  }
  function getA() {
    console.log(a);
  }

  return (
    <>
      <button onClick={setA}>Set A</button>
      <button onClick={getA}>Get A</button>
    </>
  )
}