import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';
import { OpenAiService } from '../../services/open-ai.service';
import regression from 'regression';
import { Chart, registerables } from 'chart.js';
import { Observable, catchError, flatMap, forkJoin, map, throwError } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  public users: any = [];
  public fullName: string = "";
  WeatherData: any = {
    isDay: true,
    temp_celcius: 0,
    temp_min: 0,
    temp_max: 0,
    temp_feels_like: 0,
    temp_icon: '',
    main: {
      humidity: 0,
    }
  };
  userId: number = 0;
  public userDevices: any = [];

  //location parameters
  latitude: number = 0;
  longitude: number = 0;

  //openAi parameters
  searchText: string = "";
  showOutput: boolean = false;
  output: string = "";
  isLoading: boolean = false;
  showChat: boolean = false;
  chatMessages: { text: string; sender: string }[] = [];

  constructor(private api: ApiService, private auth: AuthService, private userStoreService: UserStoreService,
    private authService: AuthService, private openAiService: OpenAiService) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    await this.getLocation();
    this.WeatherData.isDay = true;
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
        next: (res: any) => {
          this.userId = res.find((user: any) => user.username === this.fullName).id;
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
        next: (res: any) => {
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

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  async getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          let latitude = position.coords.latitude;
          let longitude = position.coords.longitude;
          await this.getWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000, // Timeout in milliseconds (optional)
          maximumAge: 0 // Maximum age of cached position (optional)
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  async getWeatherData(latitude: number, longitude: number) {
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=d2feb633db3a1d7ffee4c93fec2dc30f`;

    try {
      let response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        this.setWeatherData(data);
      } else {
        console.error('Failed to fetch weather data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }

  loadData() {
    this.loadDevicesOfCurrentUser()
      .pipe(
        flatMap(() => this.populateRegressionChart()),
        flatMap(() => this.populateMostUsedDevicesChart())
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

  populateMostUsedDevicesChart() {
    return new Observable<any>(observer => {
      const devices = this.userDevices;
      if (!devices || devices.length === 0) {
        // If devices are not loaded yet, wait for them
        observer.error('User devices not loaded');
        return;
      }
      // Create the chart that shows the most consumption devices (top 5)
      const ctxMostExpensive = document.getElementById('mostConsumptionExpensiveDevicesChart') as HTMLCanvasElement;
      const myChartMostExpensive = new Chart(ctxMostExpensive, {
        type: 'line',
        data: {
          labels: this.userDevices.slice(0, 5).map((device: any) => device.name), // Assuming device has a name property
          datasets: [{
            label: 'Top 5 devices with the highest consumption (W)',
            data: this.userDevices.slice(0, 5).map((device: any) => device.consumption),
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Adjust bar color
            borderColor: 'rgba(255, 99, 132, 1)', // Adjust border color
            borderWidth: 1 // Adjust border width
          }]
        },
        options: {
          responsive: true, // Make the chart responsive
          maintainAspectRatio: false, // Prevent the chart from maintaining aspect ratio
          scales: {
            x: {
              display: false
            }
          }
        }
      });

      // Notify that chart population is complete
      observer.next(myChartMostExpensive);
      observer.complete();
    });

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
                callback: function (value, index, values) {
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
