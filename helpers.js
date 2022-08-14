
function removeNewLinesAndSpaces(text){
    // console.log(text)
    text = text.replace(/\n/g, " ").trim().split(" ").join("");
    return text;
}

module.exports = {
    removeNewLinesAndSpaces
}
