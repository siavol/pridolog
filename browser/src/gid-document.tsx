const myCoolMessage = 'It works!';
const element = <div>Hey, {myCoolMessage}</div>;

document.addEventListener("DOMContentLoaded", () => {
    let container = document.getElementById('root');
    console.log(container);

    ReactDOM.render(element, container);
});
