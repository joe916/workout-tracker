import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '../core/challenge.service';
import { Router } from '@angular/router';
import { UserService } from '../core/user.service';
import * as _ from 'underscore';

@Component({
  selector: 'app-challenge',
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss']
})
export class ChallengeComponent implements OnInit {

  constructor(
    public challengeService: ChallengeService,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.userService.getCurrentUser().then((user) => {
      this.userService.updateUserTable(_.pick(user, 'displayName', 'email', 'uid', 'photoURL'));
    });
  }

  joinChallenge(event, id, name) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/user'], { queryParams: { 'challengeId': id, 'challengeName': name } });
  }
}
