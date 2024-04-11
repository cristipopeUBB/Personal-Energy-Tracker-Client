import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit{
  public users : any = [];
  public fullName : string = "";
  WeatherData: any;

  constructor(private api : ApiService, private auth : AuthService, private userStoreService : UserStoreService) {

  }
  ngOnInit(): void {
    this.getWeatherData();
    this.api.getUsers()
      .subscribe(res => {
        this.users = res;
      });

    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.auth.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      })
  }

  logout() {
    this.auth.signOut();
  }

  async getWeatherData() { // Trebuie sa dau manual coordonatele pentru ca nu am acces la locatia utilizatorului momentan
    let data = JSON.parse('{"coord":{"lon":21.9189,"lat":47.0479},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04n"}],"base":"stations","main":{"temp":285.99,"feels_like":285.21,"temp_min":285.99,"temp_max":286.21,"pressure":1021,"humidity":72},"visibility":10000,"wind":{"speed":1.03,"deg":110},"clouds":{"all":80},"dt":1712349921,"sys":{"type":2,"id":50396,"country":"RO","sunrise":1712289776,"sunset":1712336794},"timezone":10800,"id":671768,"name":"Oradea","cod":200}')
    this.setWeatherData(data);
  }

  setWeatherData(data: any) {
    this.WeatherData = data;
    let sunsetTime = new Date(this.WeatherData.sys.sunset * 1000);
    this.WeatherData.sunset_time = sunsetTime.toLocaleTimeString();
    let currentDate = new Date();
    this.WeatherData.isDay = currentDate.getTime() < sunsetTime.getTime();
    this.WeatherData.temp_celcius = (this.WeatherData.main.temp - 273.15).toFixed(0);
    this.WeatherData.temp_min = (this.WeatherData.main.temp_min - 273.15).toFixed(0);
    this.WeatherData.temp_max = (this.WeatherData.main.temp_max - 273.15).toFixed(0);
    this.WeatherData.temp_feels_like = (this.WeatherData.main.feels_like - 273.15).toFixed(0);
  }
}
