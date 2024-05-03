import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-prosumer',
  templateUrl: './prosumer.component.html',
  styleUrl: './prosumer.component.scss'
})
export class ProsumerComponent {

  constructor(private auth: AuthService) {
  }

  logout() {
    this.auth.signOut();
  }
}
