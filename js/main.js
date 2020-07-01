function openPage(pageName, elmnt) {
    // Hide all elements with class="tabcontent" by default */
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.add("bg-trans");
    }

    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";

    // Add the specific color to the button used to open the tab content
    elmnt.classList.remove("bg-trans");

    if (gimmickColor.hasOwnProperty(pageName)) {
        gimmick = document.getElementById("gimmick");
        gimmick.className = gimmickColor[pageName];
    }


}

let gimmickColor = {
    Home: "txt-red",
    Experience: "txt-green",
    Resume: "txt-blue"
}