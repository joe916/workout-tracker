import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '../core/challenge.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-challenge',
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss']
})
export class ChallengeComponent implements OnInit {

  constructor(
    public challengeService: ChallengeService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  joinChallenge(event, id, name) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/user'], { queryParams: { 'challengeId': id, 'challengeName': name } });
  }
}
