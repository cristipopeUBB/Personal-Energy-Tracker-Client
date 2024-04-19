import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';
import { OpenAiService } from '../../services/open-ai.service';
import regression from 'regression';
import { Chart, registerables} from 'chart.js';
import { Observable, catchError, flatMap, forkJoin, map, throwError } from 'rxjs';

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

  //openAi parameters
  searchText : string = "";
  showOutput : boolean = false;
  output : string = "";
  isLoading : boolean = false;
  showChat : boolean = false;
  chatMessages: { text: string; sender: string }[] = [];

  constructor(private api : ApiService, private auth : AuthService, private userStoreService : UserStoreService,
    private authService: AuthService, private openAiService : OpenAiService) {
      Chart.register(...registerables);
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
          this.loadData();
          console.log(this.userDevices);
        },
        error: () => {
          console.log("Error");
        }
    });
  }

  sendMessage(): void {
      if (this.searchText.trim() !== '') {
          this.chatMessages.push({ text: this.searchText, sender: 'user' });
          this.getSuggestion(); // Call method to get bot response
      }
  }

  getSuggestion() {
    this.isLoading = true;
    
    this.output = "";
    
    this.openAiService.getData(this.searchText)
      .subscribe({
        next: (res:any) => {
          this.output = res as string;
          this.showOutput = true;
          this.isLoading = false;
          this.searchText = "";
          this.chatMessages.push({ text: this.output, sender: 'bot' });
        },
        error: () => {
          console.log("Error");
          this.isLoading = false;
          this.searchText = "";
        }
    });
  }

  toggleChat() {
    this.showChat = !this.showChat;
    if (this.showChat) {
        // Reset loading state when chat is opened
        this.isLoading = false;
    }
  }

  logout() {
    this.auth.signOut();
  }

  async getWeatherData() { // Trebuie sa dau manual coordonatele pentru ca nu am acces la locatia utilizatorului momentan
    // https://api.openweathermap.org/data/2.5/weather?lat=46.7712&lon=23.6236&appid=d2feb633db3a1d7ffee4c93fec2dc30f
    let data = JSON.parse('{"coord":{"lon":21.9189,"lat":47.0465},"weather":[{"id":801,"main":"Clouds","description":"few clouds","icon":"02d"}],"base":"stations","main":{"temp":285.43,"feels_like":283.78,"temp_min":285.21,"temp_max":285.43,"pressure":1012,"humidity":41},"visibility":10000,"wind":{"speed":1.54,"deg":280},"clouds":{"all":20},"dt":1713534275,"sys":{"type":2,"id":50396,"country":"RO","sunrise":1713497789,"sunset":1713547552},"timezone":10800,"id":671768,"name":"Oradea","cod":200}')
    this.setWeatherData(data);
  }

  loadData() {
    this.loadDevicesOfCurrentUser()
      .pipe(
        flatMap(() => this.populateRegressionChart())
      )
      .subscribe({
        error: (error) => {
          console.error('Error loading data:', error);
        }
      });
  }


  loadDevicesOfCurrentUser() {
    return this.api.getUserDevices(this.userId)
      .pipe(
        map((res: any[]) => {
          // Process the usage field of each device and convert it into a string
          this.userDevices = res.map(device => ({
            ...device,
            usageString: this.getUsageString(device.usage)
          }));
          console.log(this.userDevices);
          return this.userDevices;
        }),
        catchError(error => {
          console.error('Error loading devices:', error);
          return throwError(error);
        })
      );
  }

  populateRegressionChart() { // This is the chart that shows the predicted consumption for the next month
    return new Observable<any>(observer => {
      const devices = this.userDevices;
      if (!devices || devices.length === 0) {
        // If devices are not loaded yet, wait for them
        observer.error('User devices not loaded');
        return;
      }
      
      // Calculate the end date of the next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endDateOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);

      // Filter devices based on their date added to consider only devices added before next month
      const devicesAddedBeforeNextMonth = devices.filter((device: any) => new Date(device.dateAdded) < endDateOfNextMonth);

      // Prepare data for regression analysis
      const data = devicesAddedBeforeNextMonth.map((device: { hoursUsed: any; consumption: any; }) => [device.hoursUsed, device.consumption]);

      // Perform linear regression
      const result = regression.linear(data, { precision: 10 });
      const gradient = result.equation[0];
      const yIntercept = result.equation[1];

      // Predict consumption for each device for the next month using regression equation
      const predictions = devicesAddedBeforeNextMonth.map((device: any) => {
        const totalHoursNextMonth = (new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)).getDate() * device.hoursUsed;
        const predictedConsumptionInW = gradient * totalHoursNextMonth + yIntercept;
        const predictedConsumptionInkWh = predictedConsumptionInW / 1000; // Convert to kWh

        return {
          device,
          predictedConsumption: predictedConsumptionInkWh
        };
      });

      // Create the chart
      const ctx = document.getElementById('consumptionPredictionChart') as HTMLCanvasElement;
      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: predictions.map((prediction: any) => prediction.device.name), // Assuming device has a name property
          datasets: [{
            label: 'Predicted Consumption for Next Month (kWh)',
            data: predictions.map((prediction: any) => prediction.predictedConsumption),
            borderColor: 'rgba(75, 192, 192, 1)', // Adjust line color
            borderWidth: 2, // Adjust line width
            pointStyle: 'circle', // Use circle as point style
            pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Adjust point color
            pointBorderColor: 'rgba(75, 192, 192, 1)', // Adjust point border color
            pointRadius: 5, // Adjust point radius
            pointHoverRadius: 7 // Adjust point hover radius
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value, index, values) {
                  return value + ' kWh'; // Append 'kWh' to each tick value
                }
              }
            },
            x: {
              display: false // Hide the x-axis labels
            }
          }
        }
      });

      // Notify that chart population is complete
      observer.next(myChart);
      observer.complete();
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
