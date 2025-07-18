const addCityBtn = document.getElementById('add-city-btn');
const searchDiv = document.querySelector('.search');
const cityInput = document.getElementById('cidade-input');
const widgetsContainer = document.getElementById('widgets-container');
const errorMessage = document.getElementById('mensagem-erro');
const widgetTemplate = document.getElementById('widget-template');

const API_BASE_URL = 'http://localhost:3000';

let activeWidget = null; 

/**
 * Função para criar e adicionar um novo widget na tela.
 * @param {boolean} silent
 * @returns {HTMLElement | null}
 */

const addNewWidget = (silent = false) => {
    if (widgetsContainer.childElementCount >= 4) {
        if (!silent) showError('Você pode adicionar no máximo 4 cidades.');
        return null;
    }

    const widgetClone = widgetTemplate.content.cloneNode(true);
    const newWidget = widgetClone.querySelector('.weather-widget');
    widgetsContainer.appendChild(newWidget);

    if (!silent) {
        activeWidget = newWidget;
        searchDiv.classList.remove('hidden');
        cityInput.focus();
        cityInput.value = '';
    }
    
    const deleteBtn = newWidget.querySelector('.delete-btn');
    const refreshBtn = newWidget.querySelector('.refresh-btn');

    deleteBtn.addEventListener('click', async () => {
        const cityToDelete = newWidget.dataset.city;

        if (cityToDelete) {
            const cacheKey = gerarChaveCache(cityToDelete);
            try {
                await fetch(`${API_BASE_URL}/weather/cache/${cacheKey}`, { method: 'DELETE' });
            } catch (error) {
                console.error('Falha ao enviar requisição para deletar cache:', error);
            }
        }
        
        newWidget.remove();
        addCityBtn.classList.remove('hidden'); // Garante que o botão de adicionar reapareça
    });

    refreshBtn.addEventListener('click', () => {
        const city = newWidget.dataset.city;
        if (city) {
            fetchWeatherData(city, newWidget);
        }
    });

    return newWidget;
};

/**
 * Função principal que busca os dados e atualiza o widget ativo.
 @param {string} city
 @param {HTMLElement} widget 
 */


const fetchWeatherData = async (city, widget) => {
    const cityElement = widget.querySelector('.city');
    cityElement.textContent = 'Buscando...';

    try {
        const response = await fetch(`${API_BASE_URL}/weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city }),
        });

        if (!response.ok) {
            throw new Error('Cidade não encontrada');
        }

        const result = await response.json();
        updateWidgetUI(result.data, widget);

    } catch (error) {
        showError(error.message);
        widget.remove();
    } finally {
        if (widgetsContainer.childElementCount >= 4) {
            addCityBtn.classList.add('hidden');
        }
        if(widget === activeWidget) {
            searchDiv.classList.add('hidden');
            activeWidget = null; //Reseta o widget ativo após a busca
        }
    }
};

/**
 * Atualiza a interface de um widget específico com os dados recebidos.
 * @param {object} data 
 * @param {HTMLElement} widget
 */
const updateWidgetUI = (data, widget) => {
    widget.dataset.city = data.name;

    widget.querySelector('.city').textContent = data.name;
    widget.querySelector('.temp').textContent = `${Math.round(data.main.temp)}°c`;
    widget.querySelector('.humidity').textContent = `${data.main.humidity}%`;
    widget.querySelector('.wind').textContent = `${Math.round(data.wind.speed)} km/h`;
    widget.querySelector('.weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    widget.querySelector('.weather-icon').alt = data.weather[0].description;
};

/**
 * Exibe uma mensagem de erro temporária.
 * @param {string} message - A mensagem de erro.
 */
const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
};

/**
 * Gera a chave de cache a partir do nome da cidade (função auxiliar).
 * @param {string} city - O nome da cidade.
 * @returns {string} - A chave de cache formatada.
 */
const gerarChaveCache = (city) => {
    return `city_${city.replace(/\s+/g, '_').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
};


//CARREGAR WIDGETS DO CACHE
const carregarWidgetsSalvos = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/weather`);
        if (!response.ok) throw new Error('Falha ao buscar cache do servidor.');

        const cachedData = await response.json();
        
        widgetsContainer.innerHTML = ''; 

        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
            //Limita a 4 widgets, mesmo que o cache tenha mais
            const widgetsToLoad = cachedData.slice(0, 4);
            
            //Para cada cidade no cache, cria e popula um widget
            widgetsToLoad.forEach(cityData => {
                const widgetElement = addNewWidget(true); 
                if (widgetElement) {
                   updateWidgetUI(cityData, widgetElement); 
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar widgets do cache:", error);
    } finally {
        // Ajusta a visibilidade do botão de adicionar com base na quantidade carregada
        if (widgetsContainer.childElementCount >= 4) {
            addCityBtn.classList.add('hidden');
        } else {
            addCityBtn.classList.remove('hidden');
        }
    }
};


addCityBtn.addEventListener('click', () => {
    addNewWidget(false); // Chama a função para o usuário
});

cityInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city && activeWidget) {
            fetchWeatherData(city, activeWidget);
        } else if (!city && activeWidget) {
            activeWidget.remove();
            searchDiv.classList.add('hidden');
        }
    }
});

const searchButton = document.getElementById('search-btn');
if(searchButton) searchButton.style.display = 'none';

//Executa  quando a página HTML terminar de carregar.
document.addEventListener('DOMContentLoaded', carregarWidgetsSalvos);