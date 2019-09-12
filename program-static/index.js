// Smart program script
// (c) 2018 EasyChair Ltd

var selectedLetter;
function selectLetter(anchor)
{
  if (selectedLetter) {
    document.getElementById(selectedLetter).className = "letter";
  }
  document.getElementById(anchor).className = "letter_sel";
  selectedLetter = anchor;
  return true;
};
