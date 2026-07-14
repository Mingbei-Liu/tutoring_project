let tutors = [];



const tutorContainer =
document.getElementById("tutorContainer");


const tutorImage =
document.getElementById("tutorImage");


const tutorName =
document.getElementById("tutorName");


const tutorSubjects =
document.getElementById("tutorSubjects");


const tutorBio =
document.getElementById("tutorBio");


const bookingButton =
document.getElementById("bookingButton");






fetch("tutors.json")

.then(response => response.json())

.then(data => {


    tutors = data.tutors;


    createTutorCards();


    loadTutor(tutors[0]);



});








function createTutorCards(){


    tutors.forEach(tutor => {


        const card =
        document.createElement("div");


        card.className="tutor-card";



        card.innerHTML = `


            <img
                src="${tutor.photo}"
                alt="${tutor.name}"
            >


            <h3>
                ${tutor.name}
            </h3>


            <p>
                ${tutor.subjects.join(", ")}
            </p>


        `;




        card.addEventListener(
            "click",
            function(){


                loadTutor(tutor);



                document
                .querySelectorAll(".tutor-card")
                .forEach(card =>
                    card.classList.remove("active")
                );



                card.classList.add("active");



            }
        );



        tutorContainer.appendChild(card);



    });



}









function loadTutor(tutor){


    tutorImage.src = tutor.photo;


    tutorName.textContent = tutor.name;


    tutorSubjects.textContent =
    "Subjects: " + tutor.subjects.join(", ");


    tutorBio.textContent =
    tutor.bio;


    bookingButton.href =
    tutor.bookingLink;


}