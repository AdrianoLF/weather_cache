const searchButton = document.getElementById('search-btn');
const cityInput = document.getElementById('cidade-input');
const weatherDisplay = document.querySelector('.weather');
const errorMessage = document.getElementById('mensagem-erro');
const infoMessage = document.getElementById('mensagem-info');


const tempElement = document.querySelector('.temp');
const cityElement = document.querySelector('.city');
const humidityElement = document.querySelector('.humidity');
const windElement = document.querySelector('.wind');
const weatherIconElement = document.querySelector('.weather-icon');

//Botões do Cache
const refreshCacheButton = document.getElementById('refresh-cache');
const deleteCacheButton = document.getElementById('delete-cache');

const API_BASE_URL = 'http://localhost:3000';

let currentCityName = '';

/**
 * Função para buscas iniciadas pelo USUÁRIO. Ativa a animação CSS.
 * @param {string} city 
 */
const buscarClima = async (city) => {
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.add('hidden');

    infoMessage.textContent = `Buscando clima para ${city}...`;
    infoMessage.classList.remove('show-and-fade');
    void infoMessage.offsetWidth;
    infoMessage.classList.add('show-and-fade');

    try {
        const data = await chamarApiClima(city);
        setTimeout(() => {
            atualizarUI(data);
        }, 500);
    } catch (error) {
        alert('Cidade não encontrada. Por favor, tente novamente.');
        infoMessage.classList.add('hidden');
    }
};

//Função para o carregamento INICIAL da página.

const carregarClimaInicial = async () => {
    try {
        const data = await chamarApiClima('São José dos Campos');
        atualizarUI(data);
    } catch (error) {
        exibirErro('Não foi possível carregar o clima inicial.');
    }
};

/**
 * Função central que faz a chamada à API.
 * @param {string} city - O nome da cidade.
 * @returns {Promise<object>} - Os dados do clima.
 */
const chamarApiClima = async (city) => {
    const response = await fetch(`${API_BASE_URL}/weather`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city: city }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cidade não encontrada.');
    }

    const responseData = await response.json();
    return responseData.data;
};

/**
 * Atualiza a interface do usuário com os dados recebidos da API.
 * @param {object} data - O objeto de dados do clima.
 */
const atualizarUI = (data) => {
    try {
        currentCityName = data.name;

        tempElement.textContent = `${Math.round(data.main.temp)}°c`;
        cityElement.textContent = data.name;
        humidityElement.textContent = `${data.main.humidity}%`;
        windElement.textContent = `${Math.round(data.wind.speed)} km/h`;
        
        weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        weatherIconElement.alt = data.weather[0].description;
        
        weatherDisplay.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    } catch (error) {
        exibirErro('Não foi possível exibir os dados recebidos.');
    }
};

/**
 * Exibe uma mensagem de erro na interface.
 * @param {string} message - A mensagem de erro a ser exibida.
 */
const exibirErro = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
};

/**
 * Gera a chave de cache a partir do nome da cidade.
 * @param {string} city - O nome da cidade.
 * @returns {string} - A chave de cache formatada.
 */
const gerarChaveCache = (city) => {
    return `city_${city.replace(/\s+/g, '').toLowerCase()}`;
};


searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        buscarClima(city);
        cityInput.value = '';
        cityInput.focus();
    } else {
        alert('Por favor, digite o nome de uma cidade.');
    }
});

cityInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

refreshCacheButton.addEventListener('click', async () => {
    if (!currentCityName) return;
    await buscarClima(currentCityName);
});


deleteCacheButton.addEventListener('click', async () => {
    // Se não houver cidade atual ou se já for a cidade base, não faz nada
    if (!currentCityName || currentCityName === 'São José dos Campos') {
        console.log("Nenhum cache para deletar ou já na cidade base.");
        return;
    }

    const cityToDelete = currentCityName; // Guarda o nome da cidade a ser deletada
    const cacheKey = gerarChaveCache(cityToDelete);
    
    try {
        const response = await fetch(`${API_BASE_URL}/weather/cache/${cacheKey}`, { method: 'DELETE' });

        console.log(`Requisição para deletar ${cacheKey} enviada.`);

    } catch (error) {
        console.error('Falha ao deletar o cache:', error);
    } finally {

        buscarClima('São José dos Campos');
    }
});

// Executa quando a página HTML terminar de carregar.
document.addEventListener('DOMContentLoaded', () => {
    carregarClimaInicial();
});