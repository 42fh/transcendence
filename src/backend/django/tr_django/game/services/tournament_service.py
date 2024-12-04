def build_tournament_data(tournament):
    """Build the complete tournament data structure including timetable."""
    return {
        "id": tournament.id,
        "name": tournament.name,
        "description": tournament.description,
        "startingDate": (
            tournament.start_date.isoformat() if tournament.start_date else None
        ),
        "closingRegistrationDate": tournament.end_registration.isoformat(),
        "isTimetableAvailable": bool(tournament.games.exists()),
        "participants": list(
            tournament.participants.values_list("user__username", flat=True)
        ),
        "type": tournament.type.replace("_", " "),
        "timetable": (
            build_timetable_data(tournament) if tournament.games.exists() else None
        ),
    }


def build_timetable_data(tournament):
    """Build the timetable structure for a tournament."""
    return {
        "rounds": [
            {
                "round": round_num,
                "games": [
                    {
                        "uuid": str(schedule.game.id),
                        "date": schedule.scheduled_time.isoformat(),
                        "player1": (
                            list(
                                schedule.game.players.values_list(
                                    "display_name", flat=True
                                )
                            )[0]
                            if schedule.game.players.exists()
                            else None
                        ),
                        "player2": (
                            list(
                                schedule.game.players.values_list(
                                    "display_name", flat=True
                                )
                            )[1]
                            if schedule.game.players.count() > 1
                            else None
                        ),
                        "nextGameUuid": (
                            str(schedule.game.source_game1.id)
                            if schedule.game.source_game1
                            else None
                        ),
                        "score": None,  # Add game score logic if needed
                        "winner": (
                            schedule.game.winner.display_name
                            if schedule.game.winner
                            else None
                        ),
                        "sourceGames": [
                            (
                                str(schedule.game.source_game1.id)
                                if schedule.game.source_game1
                                else None
                            ),
                            (
                                str(schedule.game.source_game2.id)
                                if schedule.game.source_game2
                                else None
                            ),
                        ],
                    }
                    for schedule in tournament.games.through.objects.filter(
                        round_number=round_num
                    )
                    .select_related("game")
                    .order_by("match_number")
                ],
            }
            for round_num in tournament.games.through.objects.values_list(
                "round_number", flat=True
            )
            .distinct()
            .order_by("round_number")
        ]
    }
