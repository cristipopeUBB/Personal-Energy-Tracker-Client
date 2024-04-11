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
  userId: number = 0;
  public userDevices: any = [];

  constructor(private api : ApiService, private auth : AuthService, private userStoreService : UserStoreService,
    private authService: AuthService) {

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
    });

    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.api.getUsers()
      .subscribe({
        next: (res:any) => {
          this.userId = res.find((user:any) => user.username === this.fullName).id;
          this.loadDevicesOfCurrentUser();
        },
        error: () => {
          console.log("Error");
        }
    });
  }

  logout() {
    this.auth.signOut();
  }

  async getWeatherData() { // Trebuie sa dau manual coordonatele pentru ca nu am acces la locatia utilizatorului momentan
    // https://api.openweathermap.org/data/2.5/weather?lat=46.7712&lon=23.6236&appid=d2feb633db3a1d7ffee4c93fec2dc30f
    let data = JSON.parse('{"coord":{"lon":23.6236,"lat":46.7712},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"base":"stations","main":{"temp":299.95,"feels_like":299.17,"temp_min":299.06,"temp_max":299.95,"pressure":1026,"humidity":22},"visibility":10000,"wind":{"speed":1.03,"deg":0},"clouds":{"all":0},"dt":1712840848,"sys":{"type":1,"id":6913,"country":"RO","sunrise":1712807094,"sunset":1712855257},"timezone":10800,"id":681290,"name":"Cluj-Napoca","cod":200}')
    this.setWeatherData(data);
  }

  loadDevicesOfCurrentUser() {
    // Load devices of current user
    this.api.getUserDevices(this.userId)
      .subscribe({
        next: (res: any[]) => {
          // Process the usage field of each device and convert it into a string
          this.userDevices = res.map(device => ({
            ...device,
            usageString: this.getUsageString(device.usage)
          }));
          console.log(this.userDevices);
        },
        error: () => {
          console.log("Error");
        }
      });
  }

  getUsageString(usage: DeviceUsage): string {
    switch (usage) {
      case DeviceUsage.Low:
        return 'Low';
      case DeviceUsage.Medium:
        return 'Medium';
      case DeviceUsage.High:
        return 'High';
      default:
        return '';
    }
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

export enum DeviceUsage {
  Low = 0,
  Medium = 1,
  High = 2
}
