var app = {
    jq: $,
    metric : true,
    async init() {
        console.log("Weather App READY");
        
        this.message = this.jq('#message');
        // UNITS
        
        this.setUnits();
        // GEOLOCATION
        await this.getLocation();
        // SEARCH FORM AND SELECT
        this.searchForm = this.jq('#search_form');
        this.searchForm.on('keyup',(e)=>{ this.initSearchForm(e); });
        this.searchField = this.jq('#search_field');
        this.searchField.on('click',()=>{ this.clearFields(); });

        this.citySelect = this.jq('#city_selector');
        this.citySelect.on('click','li',(e)=>{ this.initCitySelector(e); });
        //TRIGGER
        this.jq(document).on('click','.trigger',(e)=>{ this.initTrigger(e); });
        
    },
    async initTrigger(e) {
        var target = this.jq(e.currentTarget).attr('data-target');
        console.log(target);
        this.jq(e.currentTarget).next('.'+target).slideToggle();
    },
    async setUnits() {
        if(this.metric) {
            this.unit = {
                temperature: '&deg;',
                speed:' km/h',
                pressure: ' mmHg',
                length: ' mm',
                distance: ' km',
            }
        } else {
            this.unit = {
                temperature: ' &deg;',
                speed:' mph',
                pressure: ' inHg',
                length: ' in',
                distance: ' m',
            }
        }
    },
    async displayMessage(msg,cl) {
        setTimeout(()=>{
            this.message
                .html(msg)
                .addClass(cl);
        },1500);
        this.message.empty();
    },
    async getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.displayCurrentLocation(position.coords.latitude, position.coords.longitude);
            },this.onError, { enableHighAccuracy: true });
        }
    },
    onError(error) {
        alert('Your browser does not support location data retrieval.',error);
    },
    async displayCurrentLocation(lat,lon) {
        this.getWeather(lat,lon);
    },
    async initSearchForm(e) {
        e.preventDefault();
        var query = this.jq('#search_field').val();
        if(query) {
            var url = 'https://weatherapi-com.p.rapidapi.com/search.json?q='+query;
            var result = await this.readApi(url);
            if(!result) return;
            var html = '';
            result.forEach(el => {
                html += `<li data-lat="${el.lat}" data-lon="${el.lon}">${el.name} - ${el.country}</li>`;
            });
            this.citySelect.html(html);
        }
    },
    async clearFields() {
        this.jq('#search_field').val('');
        // this.jq('.data').empty();
        // this.jq('.content').removeClass('active');
    },
    async initCitySelector(e) {
        var lat = this.jq(e.currentTarget).attr('data-lat');
        var lon = this.jq(e.currentTarget).attr('data-lon');
        this.getWeather(lat,lon);         
        this.citySelect.empty();
    },
    async getWeather(lat,lon) {
        var url = 'https://weatherapi-com.p.rapidapi.com/forecast.json?q='+lat+'%2C'+lon+'&days=3'; 
        await this.displayWeather(url);
    },
    async displayWeather(url) {
        result = await this.readApi(url);
        if(result) {
            this.jq('.content').addClass('active');

            if(result.forecast.forecastday[0].astro.is_sun_up) {
                this.jq('#current-container').css({
                    'background-color' : 'rgba(255,255,0,0.7)',
                    'color' : '#333',
                });
            } else {                
                this.jq('#current-container').css('background-color','rgba(0,0,0,0.6)');
            }
            this.searchField.val(result.location.name);
            this.jq('#country').html(result.location.country);

            this.jq('#last_updated').html("Last updated: "+result.current.last_updated);
            this.jq('#localtime').html("Local time: "+result.location.localtime);

            this.jq('#condition-icon').html(`<img src="https:${result.current.condition.icon}" width="140" />`);
            this.jq('#condition-text').html(result.current.condition.text);
            if(this.metric) {
                this.jq('#temp_c').html(result.current.temp_c+this.unit.temperature);
                this.jq('#feelslike_c').html("Feels like: "+result.current.feelslike_c+this.unit.temperature);
                this.jq('#wind_kph').html(result.current.wind_kph+'/'+result.current.gust_kph+'<br>'+this.unit.speed);
                this.jq('#pressure_mb').html("Pressure: "+result.current.pressure_mb*0.75+this.unit.pressure);
            } else {
                this.jq('#temp_f').html(result.current.temp_f+this.unit.temperature);
                this.jq('#feelslike_f').html(result.current.feelslike_f+this.unit.temperature);
                this.jq('#wind_mph').html(result.current.wind_mph+this.unit.speed);
                this.jq('#gust_mph').html("Gusts: "+result.current.gust_mph+this.unit.speed);
                this.jq('#pressure_in').html("Pressure: "+result.current.pressure_in+this.unit.pressure);
            }            
            this.jq('#wind_degree').html(
                `<div class="wind_degree" style="transform:rotate(${result.current.wind_degree}deg);"></div>`);
            this.jq('#wind_dir').html("Direction: "+result.current.wind_dir);            
            
            this.jq('#humidity').html("Humidity: "+result.current.humidity+"%");

            await this.displayForecast(result);
        }
    }, 
    async displayForecast(result) {
        if(result.forecast.forecastday) {
            html = '';
            const date = new Date();
            let today = date.getDay();
            const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

            result.forecast.forecastday.forEach(el => {
                const date = new Date(el.date);
                let day = date.getDay();
                let dayDisplay = '';
                if(day == today) { 
                    dayDisplay = 'Today'; 
                } else if(day == today+1) { 
                    dayDisplay = 'Tomorrow'; 
                } else {
                    dayDisplay = weekday[date.getDay()];
                };
                let daily_chance_of_rain = '';
                let totalprecip_mm = '';
                let daily_chance_of_snow = '';
                let totalsnow_cm = '';
                if(el.day.daily_chance_of_rain > 0) { 
                    daily_chance_of_rain = "Rain: " + el.day.daily_chance_of_rain+"%"; 
                    totalprecip_mm = el.day.totalprecip_mm + this.unit.length;
                }
                if(el.day.daily_chance_of_snow > 0) { 
                    daily_chance_of_snow = "Snow: " + el.day.daily_chance_of_snow+"%"; 
                    totalsnow_cm = el.day.totalsnow_cm * 10 + this.unit.length;
                }
                html += `
                    <li>
                        <div class="trigger" data-target="sub-menu" role="button">
                            <div class="grid grid-4">
                                <div class="col">
                                    <p class="f17">${dayDisplay}</p>
                                    <span class="f12">${el.date}</span>
                                </div>
                                <div class="col">
                                    <img src="https:${el.day.condition.icon}" width="40" />
                                </div>
                                <div class="col" style="min-width:95px;">
                                    <span class="red f17">${el.day.maxtemp_c+this.unit.temperature}</span> / 
                                    <span class="blue f17">${el.day.mintemp_c+this.unit.temperature}</span>
                                </div>
                                <div class="col">
                                    ${el.day.maxwind_kph+this.unit.speed}
                                </div>
                            </div>
                        </div>
                        <ul class="sub-menu hidden">
                            <div class="grid grid-2">
                                <div class="row">
                                    <p>${daily_chance_of_rain} ${totalprecip_mm}</p>
                                    <p>${daily_chance_of_snow} ${totalsnow_cm}</p>
                                </div>
                                <div class="row">
                                
                                </div>
                                
                            </div>`;
                    el.hour.forEach(element => {      
                        let hourly_chance_of_rain = '';
                        let totalprecip_mm = '';
                        let hourly_chance_of_snow = '';
                        let totalsnow_cm = '';
                        if(element.chance_of_rain > 0) { 
                            hourly_chance_of_rain = "Rain: " + element.chance_of_rain+"%"; 
                            totalprecip_mm = element.precip_mm + this.unit.length;
                        }
                        if(element.chance_of_snow > 0) { 
                            hourly_chance_of_snow = "Snow: " + element.chance_of_snow+"%"; 
                            totalsnow_cm = element.precip_mm * 10 + this.unit.length;
                        }            
                    
                html +=    `<li>
                                <div class="trigger" data-target="sub-menu" role="button">
                                    <div class="grid grid-4">
                                        <div class="pt20">
                                            ${element.time.slice(11)}
                                        </div>
                                        <div class="">
                                            <img src="https:${element.condition.icon}" width="60" />
                                        </div>
                                        <div class="pt20">
                                            ${element.temp_c+this.unit.temperature}
                                        </div>
                                        <div class="text-center">
                                            <div class="wind_degree" style="transform:rotate(${element.wind_degree}deg);"></div>
                                            ${element.wind_kph+this.unit.speed}
                                        </div>
                                    </div>  
                                </div>
                                <div class="sub-menu hidden">
                                    <div class="grid grid-2">
                                        <div class="row">
                                            ${hourly_chance_of_rain} ${totalprecip_mm}
                                            ${hourly_chance_of_snow} ${totalsnow_cm}
                                            <p>Feels like: ${element.feelslike_c+this.unit.temperature}</p>
                                            <p>Visibility: ${element.vis_km+this.unit.distance}</p>
                                            <p>Wind: ${element.wind_kph+this.unit.speed}</p>
                                            <p>Dew Point: ${element.dewpoint_c+this.unit.temperature}</p>
                                            <p>Pressure: ${element.pressure_mb+this.unit.pressure}</p>
                                        </div>
                                        <div class="row">
                                            <p>Humidity: ${element.humidity}%</p>
                                            <p>UV Index: ${element.uv}</p>
                                            <p>Cloud cover: ${element.cloud}%</p>
                                        </div>
                                    </div>  
                                </div>            
                            </li>`;
                    });
                html +=`</ul>
                    </li>
                `;
            });
            this.jq('#forecast').html(html);
        }
    },
    async readApi(url) {
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            console.log("API RESULT: ",result);
            return result;
        } catch (error) {
            console.error(error);
        }        
    },
}

app.init();

