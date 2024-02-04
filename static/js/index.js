(function() {
    const inputFields = document.querySelectorAll('.input-field');
    // Додаємо обробник події фокусу до кожного поля вводу
    inputFields.forEach(inputField => {
        inputField.addEventListener('focus', function() {
            this.placeholder = ''; // Збираємо текст-підказку при фокусі
        });

        // Додаємо обробник події зміни до кожного поля вводу
        inputField.addEventListener('blur', function() {
            this.placeholder = 'Введіть текст'; // Відновлюємо текст-підказку при втраті фокусу
        });
    });

    function generateRandomHex(length) {
        let result = '';
        const characters = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    window.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    document.getElementById("generateForm").addEventListener("submit", function(event){
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const jsonData = {};
        formData.forEach((value, key) => {jsonData[key] = value});

        fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response;
        })
        .then(response => response.blob())
        .then(data => {
            const responseContainer = document.getElementById("responseContainer");
            responseContainer.innerHTML = "";

            if (data.type === "image/png" || data.type === "image/jpeg") {
                const imageUrl = URL.createObjectURL(data);
                const imageElement = document.createElement("img");
                imageElement.setAttribute("draggable", false);
                imageElement.src = imageUrl;
                responseContainer.appendChild(imageElement);

                const printButton = document.createElement("button");
                printButton.textContent = "Роздрукувати";
                printButton.onclick = function() {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`<img src="${imageUrl}">`);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                };
                responseContainer.appendChild(printButton);

                const saveButton = document.createElement("button");
                saveButton.textContent = "Зберегти";
                saveButton.style.marginLeft = "8px";
                saveButton.onclick = function() {
                    const a = document.createElement("a");
                    a.href = imageUrl;
                    a.download = `image_${generateRandomHex(16)}.jpg`;
                    a.click();
                    window.URL.revokeObjectURL(imageUrl);
                };
                responseContainer.appendChild(saveButton);

                imageElement.scrollIntoView({ behavior: 'smooth', block: 'end' }); // Плавна прокрутка до зображення
            } else {
                throw new Error('Received data is not an image');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const responseContainer = document.getElementById("responseContainer");
            responseContainer.innerHTML = "<p>Помилка: " + error.message + "</p>";
        });
    });
})();
